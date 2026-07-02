import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 5 tentatives/min/IP
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'Connexion utilisateur' })
  @ApiResponse({ status: 200, description: 'Authentification réussie, tokens retournés' })
  @ApiResponse({ status: 401, description: 'Identifiants invalides ou compte inactif' })
  @ApiResponse({ status: 429, description: 'Trop de tentatives, réessayez dans 1 minute' })
  login(
    @Body() _dto: LoginDto,
    @CurrentUser() user: any,
  ) {
    return this.authService.login(user);
  }

  @SkipThrottle()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rotation du refresh token' })
  @ApiResponse({ status: 200, description: 'Nouvelle paire de tokens' })
  @ApiResponse({ status: 401, description: 'Refresh token invalide ou expiré' })
  refresh(@CurrentUser() user: any) {
    return this.authService.refresh(user.id as string);
  }

  @SkipThrottle()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Déconnexion — invalide le refresh token' })
  @ApiResponse({ status: 200, description: '{ success: true }' })
  logout(@CurrentUser() user: any) {
    return this.authService.logout(user.id as string);
  }

  @SkipThrottle()
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Profil utilisateur courant avec rôles et permissions' })
  @ApiResponse({ status: 200, description: 'Profil complet' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  me(@CurrentUser() user: any) {
    return this.authService.getMe(user.id as string);
  }

  // 3 tentatives/heure/IP
  @Throttle({ default: { ttl: 3_600_000, limit: 3 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Demande de réinitialisation de mot de passe' })
  @ApiResponse({ status: 200, description: "Toujours 200 (ne révèle pas l'existence de l'email)" })
  @ApiResponse({ status: 429, description: 'Trop de demandes, réessayez dans 1 heure' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @SkipThrottle()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Réinitialisation du mot de passe via token' })
  @ApiResponse({ status: 200, description: '{ success: true }' })
  @ApiResponse({ status: 400, description: 'Token invalide ou expiré' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @SkipThrottle()
  @Get('invitations/:token')
  @ApiOperation({ summary: "Vérifier la validité d'un token d'invitation" })
  @ApiResponse({ status: 200, description: 'Invitation valide : email, rôle, restaurant' })
  @ApiResponse({ status: 400, description: 'Invitation invalide ou expirée' })
  verifyInvitation(@Param('token') token: string) {
    return this.authService.verifyInvitation(token);
  }

  // 5 tentatives/min/IP
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('invitations/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Accepter une invitation et créer le compte" })
  @ApiResponse({ status: 200, description: 'Compte créé, tokens retournés' })
  @ApiResponse({ status: 400, description: 'Invitation invalide ou expirée' })
  @ApiResponse({ status: 409, description: 'Un compte existe déjà avec cet email' })
  acceptInvitation(@Body() dto: AcceptInvitationDto) {
    return this.authService.acceptInvitation(dto.token, dto.firstName, dto.lastName, dto.password);
  }
}
