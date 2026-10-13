/**
 * Corrige le circuit livraison des workflows commandes créés avant la règle
 * "le livreur ne récupère que des commandes prêtes".
 *
 * Ancien défaut : En préparation → En livraison (livreur), sans passer par Prête.
 * Nouveau       : En préparation → Prête (cuisinier) → En livraison (livreur).
 *
 * Ne touche qu'aux workflows qui ont encore l'ancienne transition ; idempotent.
 * Usage : npx ts-node prisma/fix-delivery-workflow.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const workflows = await prisma.workflowDefinition.findMany({
    where: { entityType: 'order' },
    include: { states: { select: { id: true, slug: true } } },
  });

  let fixed = 0;
  for (const wf of workflows) {
    const stateId = (slug: string) => wf.states.find((s) => s.slug === slug)?.id;
    const preparing = stateId('in_preparation');
    const ready = stateId('ready');
    const delivering = stateId('in_delivery');
    if (!preparing || !ready || !delivering) continue;

    const legacy = await prisma.workflowTransition.findFirst({
      where: { workflowId: wf.id, fromStateId: preparing, toStateId: delivering },
    });
    if (!legacy) continue;

    await prisma.$transaction(async (tx) => {
      // La transition livreur part désormais de "Prête"
      await tx.workflowTransition.update({
        where: { id: legacy.id },
        data: { fromStateId: ready },
      });

      const toReady = await tx.workflowTransition.findFirst({
        where: { workflowId: wf.id, fromStateId: preparing, toStateId: ready },
      });
      if (!toReady) {
        await tx.workflowTransition.create({
          data: {
            workflowId: wf.id,
            fromStateId: preparing,
            toStateId: ready,
            name: 'Marquer prête',
            allowedRoles: ['cuisinier'],
          },
        });
      }
    });

    fixed++;
    console.log(`✓ Workflow ${wf.id} (tenant ${wf.tenantId}) corrigé`);
  }

  console.log(`\n${fixed} workflow(s) corrigé(s) sur ${workflows.length}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
