# -*- coding: utf-8 -*-
import os

path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'LK-Studio-App-Brief.pdf')
lines = [
    'LK Studio - Application Brief',
    '',
    'Overview:',
    'LK Studio is a multi-shop tailor management platform built with Next.js, Prisma, and Tailwind.',
    'It supports shop owners and customers in a single PWA-enabled web app.',
    '',
    'Key features:',
    '- Shop dashboard, order tracking, measurements, and design catalog management.',
    '- Customer order placement, family measurements, bill view, and price quote tracking.',
    '- OTP/login flows for shop and customer users, shop profile, and bill sharing.',
    '- Uses PostgreSQL/Supabase-style hosting guidance, JWT sessions, and mobile-friendly UI.',
    '',
    'Deployment notes:',
    '- Production server deploys from main branch and runs on Render.',
    '- Requires JWT_SECRET, DATABASE_URL, S3/R2 upload config, and site URL env variables.',
    '- Play Store app uses Capacitor Android with production server URL and signed AAB release.',
]

text = '\n'.join(lines)
contents = ['BT', '/F1 14 Tf', '72 740 Td']
for line in lines:
    safe = line.replace('(', '\(').replace(')', '\)')
    contents.append('({}) Tj'.format(safe))
    contents.append('0 -18 Td')
contents.append('ET')
stream = '\n'.join(contents) + '\n'
length = len(stream)

obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n'
obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n'
obj3 = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n'
obj4 = '4 0 obj\n<< /Length %d >>\nstream\n%sendstream\nendobj\n' % (length, stream)
obj5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n'

objects = [obj1, obj2, obj3, obj4, obj5]

pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'
offsets = []
pos = len(pdf)
for obj in objects:
    offsets.append(pos)
    pdf += obj
    pos = len(pdf)

xref = 'xref\n0 %d\n0000000000 65535 f \n' % (len(objects) + 1)
for off in offsets:
    xref += '%010d 00000 n \n' % off

trailer = 'trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n' % (len(objects) + 1, len(pdf) + len(xref))
pdf += xref + trailer

with open(path, 'wb') as f:
    f.write(pdf)
print('created', path)
