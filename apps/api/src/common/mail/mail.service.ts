import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter!: Transporter;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    // Support both SMTP_USER (production) and MAIL_USERNAME (legacy/dev)
    const user =
      this.config.get<string>('SMTP_USER') ??
      this.config.get<string>('MAIL_USERNAME') ??
      '';
    // Les mots de passe d'application Google contiennent des espaces — on les retire
    const pass = (
      this.config.get<string>('SMTP_PASS') ??
      this.config.get<string>('MAIL_PASSWORD') ??
      ''
    ).replace(/\s/g, '');

    if (!user || !pass) {
      this.logger.warn('[MAIL] SMTP_USER/SMTP_PASS (ou MAIL_USERNAME/MAIL_PASSWORD) manquant — les emails ne seront pas envoyés');
      return;
    }

    const host = this.config.get<string>('SMTP_HOST', 'smtp.gmail.com');
    const port = this.config.get<number>('SMTP_PORT', 587);

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    this.logger.log(`[MAIL] Transporter initialisé pour ${user} via ${host}:${port}`);
  }

  private get from(): string {
    const user =
      this.config.get<string>('SMTP_FROM') ??
      this.config.get<string>('SMTP_USER') ??
      this.config.get<string>('MAIL_USERNAME', '');
    return user.includes('@') ? `TérangaTable <${user}>` : user;
  }

  async sendRequestConfirmation(to: string, ownerName: string, restaurantName: string) {
    await this.send({
      to,
      subject: "Votre demande d'inscription a bien été reçue — TérangaTable",
      html: `
        <p>Bonjour ${ownerName},</p>
        <p>Nous avons bien reçu votre demande d'inscription pour <strong>${restaurantName}</strong>.</p>
        <p>Notre équipe va examiner votre dossier et vous contacter dans les plus brefs délais.</p>
        <br/>
        <p>L'équipe TérangaTable</p>
      `,
    });
  }

  async sendOnboardingCredentials(
    to: string,
    ownerName: string,
    restaurantName: string,
    tenantSlug: string,
    tempPassword: string,
  ) {
    const appUrl = this.config.get<string>('APP_URL', 'http://localhost:3000');
    await this.send({
      to,
      subject: `Bienvenue sur TérangaTable — Votre espace ${restaurantName} est prêt`,
      html: `
        <p>Bonjour ${ownerName},</p>
        <p>Votre demande a été approuvée ! Votre espace <strong>${restaurantName}</strong> est maintenant actif.</p>
        <p><strong>Vos identifiants de connexion :</strong></p>
        <ul>
          <li>Email : ${to}</li>
          <li>Mot de passe temporaire : <strong>${tempPassword}</strong></li>
        </ul>
        <p><a href="${appUrl}/${tenantSlug}/login">Accéder à mon espace →</a></p>
        <p>Pensez à changer votre mot de passe dès votre première connexion.</p>
        <br/>
        <p>L'équipe TérangaTable</p>
      `,
    });
  }

  async sendPasswordReset(to: string, resetUrl: string) {
    await this.send({
      to,
      subject: 'Réinitialisation de votre mot de passe — TérangaTable',
      html: `
        <p>Bonjour,</p>
        <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
        <p><a href="${resetUrl}">Réinitialiser mon mot de passe →</a></p>
        <p>Ce lien est valable pendant 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
        <br/>
        <p>L'équipe TérangaTable</p>
      `,
    });
  }

  async sendAdminInvitation(
    to: string,
    firstName: string,
    role: string,
    tempPassword: string,
  ) {
    const appUrl = this.config.get<string>('APP_URL', 'http://localhost:3000');
    await this.send({
      to,
      subject: 'Invitation administrateur — TérangaTable',
      html: `
        <p>Bonjour ${firstName},</p>
        <p>Vous avez été invité(e) en tant que <strong>${role}</strong> sur la plateforme TérangaTable.</p>
        <p><strong>Vos identifiants :</strong></p>
        <ul>
          <li>Email : ${to}</li>
          <li>Mot de passe temporaire : <strong>${tempPassword}</strong></li>
        </ul>
        <p><a href="${appUrl}/super-admin/login">Accéder à l'interface admin →</a></p>
        <br/>
        <p>L'équipe TérangaTable</p>
      `,
    });
  }

  private async send(options: { to: string; subject: string; html: string }) {
    if (!this.transporter) {
      this.logger.warn(`[MAIL] Transporter non disponible — email non envoyé à ${options.to}`);
      return;
    }
    try {
      await this.transporter.sendMail({ from: this.from, ...options });
      this.logger.log(`[MAIL] Envoyé à ${options.to} — ${options.subject}`);
    } catch (err) {
      this.logger.error(`[MAIL] Échec envoi à ${options.to}: ${(err as Error).message}`);
    }
  }
}
