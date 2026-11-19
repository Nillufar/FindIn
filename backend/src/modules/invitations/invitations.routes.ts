import {Router} from 'express';
import {z} from 'zod';
import {HttpError} from '../../lib/http-error.js';
import {prisma} from '../../lib/prisma.js';
import {invitationSelect, toInvitationView} from '../../lib/mappers.js';
import {asyncHandler, currentUserId, requireUser, routeParam} from '../../middleware/auth.js';

export const invitationsRouter = Router();

const respondSchema = z.object({decision: z.enum(['ACCEPT', 'DECLINE'])});

/**
 * Accept or decline. A REQUEST (someone asked to join) is answered by the post owner;
 * an INVITE (the owner asked someone) is answered by the invited person.
 *
 * Accepting a JOB or COLLABORATION that belongs to an organization also records the role
 * on the person's profile, e.g. "Marketing Intern at Bright Labs".
 */
invitationsRouter.post('/:invitationId/respond', requireUser, asyncHandler(async (request, response) => {
    const userId = currentUserId(request);
    const {decision} = respondSchema.parse(request.body);
    const invitation = await prisma.invitation.findUnique({
        where: {id: routeParam(request, 'invitationId')},
        include: {project: true},
    });
    if (!invitation) throw new HttpError(404, 'Request not found');

    const responderId = invitation.type === 'REQUEST' ? invitation.project.ownerId : invitation.applicantId;
    if (responderId !== userId) throw new HttpError(403, 'Only the other side can answer this');
    if (invitation.status !== 'PENDING') throw new HttpError(409, 'This was already answered');

    const status = decision === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED';
    const updated = await prisma.$transaction(async (tx) => {
        const row = await tx.invitation.update({
            where: {id: invitation.id},
            data: {status},
            select: invitationSelect,
        });

        const {project} = invitation;
        if (status === 'ACCEPTED' && project.organizationId && project.kind !== 'PROJECT') {
            const alreadyRecorded = await tx.membership.findFirst({
                where: {userId: invitation.applicantId, sourcePostId: project.id},
            });
            if (!alreadyRecorded) {
                await tx.membership.create({
                    data: {
                        userId: invitation.applicantId,
                        organizationId: project.organizationId,
                        title: project.kind === 'JOB' ? project.title : `Collaborator · ${project.title}`,
                        sourcePostId: project.id,
                    },
                });
            }
        }
        return row;
    });

    response.json(toInvitationView(updated));
}));

/** Withdraw a request you sent, or an invitation you sent, while it is still pending. */
invitationsRouter.post('/:invitationId/cancel', requireUser, asyncHandler(async (request, response) => {
    const userId = currentUserId(request);
    const invitation = await prisma.invitation.findUnique({where: {id: routeParam(request, 'invitationId')}});
    if (!invitation) throw new HttpError(404, 'Request not found');
    const senderId = invitation.type === 'REQUEST' ? invitation.applicantId : invitation.inviterId;
    if (senderId !== userId) throw new HttpError(403, 'Only the sender can withdraw this');
    if (invitation.status !== 'PENDING') throw new HttpError(409, 'This was already answered');

    const row = await prisma.invitation.update({
        where: {id: invitation.id},
        data: {status: 'CANCELLED'},
        select: invitationSelect,
    });
    response.json(toInvitationView(row));
}));
