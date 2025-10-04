import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ poolAddress: string; userAddress: string }> }
) {
  try {
    const { poolAddress, userAddress } = await params;

    if (!poolAddress || !userAddress) {
      return NextResponse.json(
        { error: 'Pool address and user address are required' },
        { status: 400 }
      );
    }

    // Get user's LP positions for this pool
    const positions = await prisma.liquidityPosition.findMany({
      where: {
        poolAddress,
        userAddress,
        status: 'ACTIVE',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(positions);
  } catch (error) {
    console.error('Error fetching LP positions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch LP positions' },
      { status: 500 }
    );
  }
}
