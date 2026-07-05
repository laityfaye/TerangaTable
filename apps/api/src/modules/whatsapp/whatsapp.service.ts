import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../../prisma/prisma.service';
import { MarketplaceService } from '../marketplace/marketplace.service';
import { MenuContextService } from './services/menu-context.service';
import { TwilioClientService } from './services/twilio-client.service';
import { WhatsappOrdersService, DraftCartItem } from './whatsapp-orders.service';
import { WHATSAPP_TOOLS } from './tools/tool-definitions';
import { WHATSAPP_PERSONA_PROMPT } from './prompts/system-prompt';
import { CLAUDE_MODEL, MAX_TOOL_ITERATIONS, MAX_HISTORY_TURNS } from './whatsapp.constants';

interface HistoryTurn {
  role: 'user' | 'assistant';
  content: string;
}

interface ConversationState {
  tenantId: string | null;
  tenantSlug: string | null;
  customerId: string | null;
  stage: 'discovery' | 'ordering' | 'completed';
  draftCart: DraftCartItem[];
  history: HistoryTurn[];
}

const FALLBACK_MESSAGE =
  "Désolé, je rencontre un souci technique. Un membre de l'équipe va vous recontacter, ou réessayez dans quelques instants.";

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly anthropic: Anthropic | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly marketplace: MarketplaceService,
    private readonly menuContext: MenuContextService,
    private readonly twilio: TwilioClientService,
    private readonly whatsappOrders: WhatsappOrdersService,
  ) {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    this.anthropic = apiKey ? new Anthropic({ apiKey }) : null;
  }

  async handleInboundMessage(fromRaw: string, body: string, messageSid: string): Promise<void> {
    const phone = fromRaw.replace(/^whatsapp:/, '');

    if (!this.anthropic) {
      this.logger.warn('ANTHROPIC_API_KEY absent — message ignoré');
      await this.twilio.sendMessage(phone, FALLBACK_MESSAGE);
      return;
    }

    const state = await this.loadState(phone);

    if (state.tenantId) {
      await this.prisma.setTenantContext(state.tenantId);
    } else {
      await this.prisma.setSuperAdminContext();
    }

    let replyText: string;
    try {
      replyText = await this.runConversationTurn(state, body, phone);
    } catch (err) {
      this.logger.error(`Erreur conversation WhatsApp (${phone}): ${(err as Error).message}`);
      replyText = FALLBACK_MESSAGE;
    }

    state.history.push({ role: 'user', content: body });
    state.history.push({ role: 'assistant', content: replyText });
    if (state.history.length > MAX_HISTORY_TURNS * 2) {
      state.history = state.history.slice(-MAX_HISTORY_TURNS * 2);
    }

    await this.saveState(phone, messageSid, state);
    await this.twilio.sendMessage(phone, replyText);
  }

  // ── Conversation state persistence ─────────────────────────────────────────

  private async loadState(phone: string): Promise<ConversationState> {
    const existing = await this.prisma.whatsappConversation.findUnique({ where: { customerPhone: phone } });
    if (!existing) {
      return { tenantId: null, tenantSlug: null, customerId: null, stage: 'discovery', draftCart: [], history: [] };
    }

    let tenantSlug: string | null = null;
    if (existing.tenantId) {
      const tenant = await this.menuContext.getTenantInfo(existing.tenantId);
      tenantSlug = tenant?.slug ?? null;
    }

    return {
      tenantId: existing.tenantId,
      tenantSlug,
      customerId: existing.customerId,
      stage: existing.stage,
      draftCart: (existing.draftCart as unknown as DraftCartItem[]) ?? [],
      history: (existing.history as unknown as HistoryTurn[]) ?? [],
    };
  }

  private async saveState(phone: string, messageSid: string, state: ConversationState): Promise<void> {
    await this.prisma.whatsappConversation.upsert({
      where: { customerPhone: phone },
      create: {
        customerPhone: phone,
        tenantId: state.tenantId,
        customerId: state.customerId,
        stage: state.stage,
        draftCart: state.draftCart as unknown as object,
        history: state.history as unknown as object,
        lastMessageSid: messageSid,
      },
      update: {
        tenantId: state.tenantId,
        customerId: state.customerId,
        stage: state.stage,
        draftCart: state.draftCart as unknown as object,
        history: state.history as unknown as object,
        lastMessageSid: messageSid,
        lastMessageAt: new Date(),
      },
    });
  }

  // ── Boucle tool-use Claude ──────────────────────────────────────────────────

  private async runConversationTurn(state: ConversationState, userMessage: string, phone: string): Promise<string> {
    const systemBlocks: Anthropic.TextBlockParam[] = [
      { type: 'text', text: WHATSAPP_PERSONA_PROMPT, cache_control: { type: 'ephemeral', ttl: '1h' } },
    ];

    if (state.tenantId) {
      const tenant = await this.menuContext.getTenantInfo(state.tenantId);
      if (tenant) {
        const menuBlock = await this.menuContext.renderMenuBlock(tenant);
        systemBlocks.push({
          type: 'text',
          text: `Restaurant confirmé : ${tenant.name}. Menu disponible :\n${menuBlock}`,
          cache_control: { type: 'ephemeral' },
        });
      }
    }

    const messages: Anthropic.MessageParam[] = [
      ...state.history.map((h) => ({ role: h.role, content: h.content })),
      { role: 'user', content: userMessage },
    ];

    for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
      const response = await this.anthropic!.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        thinking: { type: 'disabled' },
        output_config: { effort: 'low' },
        system: systemBlocks,
        tools: WHATSAPP_TOOLS,
        messages,
      });

      messages.push({ role: 'assistant', content: response.content });

      if (response.stop_reason !== 'tool_use') {
        const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
        return textBlock?.text ?? FALLBACK_MESSAGE;
      }

      const toolUseBlocks = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of toolUseBlocks) {
        const result = await this.dispatchTool(block.name, block.input as Record<string, unknown>, state, phone);
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: result.text,
          is_error: result.isError,
        });
      }

      messages.push({ role: 'user', content: toolResults });
    }

    this.logger.warn(`Boucle tool-use interrompue après ${MAX_TOOL_ITERATIONS} itérations (tel: ${phone})`);
    return FALLBACK_MESSAGE;
  }

  // ── Dispatch des outils ──────────────────────────────────────────────────────

  private async dispatchTool(
    name: string,
    input: Record<string, unknown>,
    state: ConversationState,
    phone: string,
  ): Promise<{ text: string; isError: boolean }> {
    try {
      switch (name) {
        case 'search_restaurants':
          return await this.toolSearchRestaurants(input);
        case 'confirm_restaurant':
          return await this.toolConfirmRestaurant(input, state);
        case 'search_menu':
          return await this.toolSearchMenu(input, state);
        case 'add_to_cart':
          return this.toolAddToCart(input, state);
        case 'remove_from_cart':
          return this.toolRemoveFromCart(input, state);
        case 'view_cart':
          return await this.toolViewCart(state);
        case 'place_order':
          return await this.toolPlaceOrder(input, state, phone);
        case 'check_order_status':
          return await this.toolCheckOrderStatus(input, state, phone);
        case 'switch_restaurant':
          return this.toolSwitchRestaurant(state);
        default:
          return { text: `Outil inconnu: ${name}`, isError: true };
      }
    } catch (err) {
      return { text: (err as Error).message, isError: true };
    }
  }

  private async toolSearchRestaurants(input: Record<string, unknown>) {
    const query = String(input['query'] ?? '');
    const citySlug = input['city_slug'] ? String(input['city_slug']) : undefined;
    const results = await this.marketplace.search(query, citySlug);
    if (results.length === 0) {
      return { text: 'Aucun restaurant trouvé pour cette recherche.', isError: false };
    }
    const summary = results
      .slice(0, 5)
      .map((r) => `- ${r.name} (slug: ${r.slug}) — ${r.city}${r.cuisine_type ? `, cuisine ${r.cuisine_type}` : ''}`)
      .join('\n');
    return { text: summary, isError: false };
  }

  private async toolConfirmRestaurant(input: Record<string, unknown>, state: ConversationState) {
    const slug = String(input['tenant_slug'] ?? '');
    const tenant = await this.prisma.tenant.findFirst({
      where: { slug, status: { in: ['active', 'trial'] } },
      select: {
        id: true,
        name: true,
        tenantModules: { where: { isActive: true, module: { slug: 'whatsapp' } }, select: { id: true } },
      },
    });

    if (!tenant) {
      return { text: `Restaurant "${slug}" introuvable.`, isError: true };
    }
    if (tenant.tenantModules.length === 0) {
      return { text: `${tenant.name} n'est pas encore disponible sur l'assistant WhatsApp.`, isError: true };
    }

    state.tenantId = tenant.id;
    state.tenantSlug = slug;
    state.stage = 'ordering';
    state.draftCart = [];
    await this.prisma.setTenantContext(tenant.id);

    return { text: `Restaurant confirmé : ${tenant.name}. Le menu est disponible dans le contexte.`, isError: false };
  }

  private async toolSearchMenu(input: Record<string, unknown>, state: ConversationState) {
    if (!state.tenantId) {
      return { text: 'Aucun restaurant confirmé — utilise confirm_restaurant avant search_menu.', isError: true };
    }
    const tenant = await this.menuContext.getTenantInfo(state.tenantId);
    if (!tenant) {
      return { text: 'Restaurant introuvable.', isError: true };
    }
    const query = String(input['query'] ?? '');
    const matches = await this.menuContext.searchProducts(tenant, query);
    if (matches.length === 0) {
      return { text: `Aucun plat ne correspond à "${query}" dans ce menu.`, isError: false };
    }
    return {
      text: matches.map((m) => `- [id: ${m.id}] ${m.name}`).join('\n'),
      isError: false,
    };
  }

  private toolAddToCart(input: Record<string, unknown>, state: ConversationState) {
    if (state.stage !== 'ordering' || !state.tenantId) {
      return { text: 'Aucun restaurant confirmé — utilise confirm_restaurant avant add_to_cart.', isError: true };
    }
    const productId = String(input['product_id'] ?? '');
    const quantity = Math.max(1, Number(input['quantity'] ?? 1));
    const options = Array.isArray(input['options'])
      ? (input['options'] as Array<{ option_id: string }>).map((o) => o.option_id)
      : [];
    const notes = input['notes'] ? String(input['notes']) : undefined;

    // Sémantique "set", pas "incrément" : si Claude rappelle add_to_cart pour le
    // même produit (ex: reconfirmation avant place_order), on remplace la
    // quantité au lieu de l'additionner — sinon un appel redondant double
    // silencieusement le panier (voir historique : bug constaté en test réel).
    const existing = state.draftCart.find(
      (i) => i.productId === productId && JSON.stringify(i.optionIds.sort()) === JSON.stringify([...options].sort()),
    );
    if (existing) {
      existing.quantity = quantity;
      if (notes !== undefined) existing.notes = notes;
    } else {
      state.draftCart.push({ productId, quantity, optionIds: options, notes });
    }

    return { text: 'Article ajouté au panier.', isError: false };
  }

  private toolRemoveFromCart(input: Record<string, unknown>, state: ConversationState) {
    const productId = String(input['product_id'] ?? '');
    const quantity = input['quantity'] !== undefined ? Number(input['quantity']) : undefined;

    const idx = state.draftCart.findIndex((i) => i.productId === productId);
    if (idx === -1) {
      return { text: 'Ce produit n\'est pas dans le panier.', isError: true };
    }
    if (quantity === undefined || quantity >= state.draftCart[idx]!.quantity) {
      state.draftCart.splice(idx, 1);
    } else {
      state.draftCart[idx]!.quantity -= quantity;
    }
    return { text: 'Panier mis à jour.', isError: false };
  }

  private async toolViewCart(state: ConversationState) {
    if (!state.tenantId) {
      return { text: 'Aucun restaurant confirmé.', isError: true };
    }
    const { lines, subtotal } = await this.whatsappOrders.resolveCart(state.tenantId, state.draftCart);
    if (lines.length === 0) {
      return { text: 'Le panier est vide.', isError: false };
    }
    const tenant = await this.menuContext.getTenantInfo(state.tenantId);
    const summary = lines
      .map((l) => `- ${l.quantity}x ${l.productName}${l.options.length ? ` (${l.options.map((o) => o.optionName).join(', ')})` : ''} — ${l.lineTotal} ${tenant?.currencySymbol ?? ''}`)
      .join('\n');
    return { text: `${summary}\nTotal : ${subtotal} ${tenant?.currencySymbol ?? ''}`, isError: false };
  }

  private async toolPlaceOrder(input: Record<string, unknown>, state: ConversationState, phone: string) {
    if (!state.tenantId) {
      return { text: 'Aucun restaurant confirmé.', isError: true };
    }
    const customerName = input['customer_name'] ? String(input['customer_name']) : undefined;
    const notes = input['notes'] ? String(input['notes']) : undefined;

    const { orderNumber, total } = await this.whatsappOrders.createOrderFromConversation(
      state.tenantId,
      phone,
      state.draftCart,
      customerName,
      notes,
    );

    state.draftCart = [];
    state.stage = 'completed';

    return { text: `Commande confirmée ! Numéro ${orderNumber}, total ${total}. Merci, à emporter dès qu'elle est prête.`, isError: false };
  }

  private async toolCheckOrderStatus(input: Record<string, unknown>, state: ConversationState, phone: string) {
    if (!state.tenantId) {
      return { text: 'Aucun restaurant confirmé.', isError: true };
    }
    const orderNumber = input['order_number'] ? String(input['order_number']) : undefined;
    const order = await this.whatsappOrders.getLatestOrderStatus(state.tenantId, phone, orderNumber);
    if (!order) {
      return { text: 'Aucune commande trouvée.', isError: false };
    }
    return { text: `Commande ${order.orderNumber} : ${order.status}, total ${order.total}.`, isError: false };
  }

  private toolSwitchRestaurant(state: ConversationState) {
    state.tenantId = null;
    state.tenantSlug = null;
    state.stage = 'discovery';
    state.draftCart = [];
    return { text: 'Restaurant réinitialisé — dis-moi quel restaurant tu cherches.', isError: false };
  }
}
