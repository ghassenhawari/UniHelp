import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@ApiTags('Admin-Test')
@ApiBearerAuth('JWT-auth')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {

    @Get('ping')
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Test RBAC Admin' })
    ping() {
        return { message: 'Success: You are an Admin!' };
    }

    @Get('super-ping')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Test RBAC Super Admin' })
    superPing() {
        return { message: 'Success: You are a Super Admin!' };
    }
}
