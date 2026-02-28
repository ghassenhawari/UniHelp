import { Controller, Get, Delete, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { StatsService } from './stats.service';
import { AdminGuard } from '../common/guards/admin.guard';

@ApiTags('Stats')
@ApiSecurity('admin-secret')
@UseGuards(AdminGuard)
@Controller('stats')
export class StatsController {
    constructor(private readonly statsService: StatsService) { }

    @Get()
    @ApiOperation({
        summary: 'Obtenir les statistiques d\'utilisation',
        description: 'Questions posées, taux de réussite, documents les plus utilisés, top questions…',
    })
    @ApiResponse({ status: 200, description: 'Snapshot des statistiques' })
    @ApiResponse({ status: 401, description: 'Admin required' })
    getStats() {
        return this.statsService.getSnapshot();
    }

    @Delete('clear')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Effacer l\'historique des statistiques' })
    @ApiResponse({ status: 200, description: 'Stats effacées' })
    clearStats() {
        this.statsService.clearStats();
        return { message: 'Statistiques effacées avec succès' };
    }
}
