const express = require('express');
import cors from 'cors';

import { PrismaClient } from '@prisma/client';
import { convertHoursToMinutesString } from './utils/convert-hour-to-minute';
import { convertMinutesToHour } from './utils/convert-minute-to-hour';

const app = express();
app.use(express.json());

app.use(cors());

const prisma = new PrismaClient({
    log: ['query'],
});

app.get('/games', async (req: any, res: any) => {
    const games = await prisma.game.findMany({
        include: {
            _count: {
                select: {
                    ads: true,
                },
            },
        },
    });
    return res.json(games);
});

app.post('/games/:id/ads', async (req: any, res: any) => {
    const gameId = req.params.id;
    const body = req.body;

    const ad = await prisma.ad.create({
        data: {
            gameId,
            name: body.name,
            yearsPlaying: body.yearsPlaying,
            discord: body.discord,
            weekDays: body.weekDays.join(','),
            hourStart: convertHoursToMinutesString(body.hourStart),
            hourEnd: body.hourEnd,
            useVoiceChannel: body.useVoiceChannel,
        },
    });

    return res.status(201).json(body);
});
app.get('/games/:id/ads', async (req: any, res: any) => {
    const gameId = req.params.id;

    const ads = await prisma.ad.findMany({
        select: {
            id: true,
            name: true,
            weekDays: true,
            useVoiceChannel: true,
            yearsPlaying: true,
            hourStart: true,
            hourEnd: true,
        },
        where: {
            gameId,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
    return res.json(
        ads.map((ad) => {
            return {
                ...ad,
                weekDays: ad.weekDays.split(','),
                hourStart: convertMinutesToHour(ad.hourStart),
                hourEnd: convertMinutesToHour(ad.hourEnd),
            };
        })
    );
});

app.get('/ads/:id/discord', async (req: any, res: any) => {
    const adId = req.params.id;

    const ad = await prisma.ad.findUniqueOrThrow({
        select: {
            discord: true,
        },
        where: {
            id: adId,
        },
    });
    return res.json({
        discord: ad.discord,
    });
});

app.listen(5550);
