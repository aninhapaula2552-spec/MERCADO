import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const zipPath = path.join(process.cwd(), 'public', 'mercado-fresh-codigo-fonte.zip');
    
    if (!fs.existsSync(zipPath)) {
      return new NextResponse('Arquivo zip não encontrado no servidor', { status: 404 });
    }

    const fileBuffer = fs.readFileSync(zipPath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="mercado-fresh-codigo-fonte.zip"',
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Erro ao disponibilizar download do zip:', error);
    return new NextResponse('Erro interno ao gerar download', { status: 500 });
  }
}
