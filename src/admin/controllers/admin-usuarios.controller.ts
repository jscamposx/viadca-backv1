import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  UseGuards,
  ValidationPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UsuariosService } from '../../usuarios/usuarios.service';
import { UpdateUsuarioRolDto } from '../../usuarios/dto/update-usuario-rol.dto';
import { AdminGuard } from '../../usuarios/guards/admin.guard';

@Controller('admin/usuarios')
export class AdminUsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  @UseGuards(AdminGuard)
  async findAll() {
    return this.usuariosService.findAllUsers();
  }


  @Get(':id')
  @UseGuards(AdminGuard)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usuariosService.findUserById(id);
  }

 
  @Get('deleted/list')
  @UseGuards(AdminGuard)
  async findDeleted() {
    return this.usuariosService.findDeleted();
  }

  @Patch(':id/role')
  @UseGuards(AdminGuard)
  async updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateUsuarioRolDto: UpdateUsuarioRolDto,
  ) {
    return this.usuariosService.updateUserRole(id, updateUsuarioRolDto);
  }


  @Patch(':id/soft-delete')
  @UseGuards(AdminGuard)
  async softDelete(@Param('id', ParseUUIDPipe) id: string) {
    await this.usuariosService.softDelete(id);
    return { message: 'Usuario eliminado exitosamente' };
  }

 
  @Patch(':id/restore')
  @UseGuards(AdminGuard)
  async restore(@Param('id', ParseUUIDPipe) id: string) {
    await this.usuariosService.restore(id);
    return { message: 'Usuario restaurado exitosamente' };
  }

 
  @Post(':id/hard-delete')
  @UseGuards(AdminGuard)
  async hardDelete(@Param('id', ParseUUIDPipe) id: string) {
    await this.usuariosService.hardDelete(id);
    return { message: 'Usuario eliminado permanentemente' };
  }

 
  @Get('stats/overview')
  @UseGuards(AdminGuard)
  async getStats() {
    return this.usuariosService.getUserStats();
  }
}
