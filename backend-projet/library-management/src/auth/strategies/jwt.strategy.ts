import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
}

// Extrait le token depuis le header Authorization OU depuis ?token= dans l'URL
// (nécessaire pour les exports téléchargés via window.open)
function extractJwt(req: Request): string | null {
  // 1. Header Authorization: Bearer <token>
  const fromHeader = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
  if (fromHeader) return fromHeader;
  // 2. Query param ?token=<token>
  const tokenFromQuery = req.query?.token;
  if (typeof tokenFromQuery === 'string' && tokenFromQuery) return tokenFromQuery;
  return null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: extractJwt,
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  // Ce que retourne validate() sera injecté dans req.user
  validate(payload: JwtPayload) {
    return {
      sub: payload.sub,
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
