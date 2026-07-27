const {
  Body,
  Controller,
  Get,
  Headers,
  Inject,
  Param,
  Post,
  Query,
} = require('@nestjs/common');
const { BarberShopService } = require('../services/barbershop.service');

class AppController {
  constructor(barberShopService) {
    this.barberShopService = barberShopService;
  }

  getAuthenticatedUser(authHeader, roles = []) {
    const result = this.barberShopService.authenticateToken(authHeader);
    if (result.error) {
      return result;
    }

    if (roles.length > 0 && !roles.includes(result.role)) {
      return { error: 'Acesso nao autorizado.' };
    }

    return result;
  }

  scopedBarbershopId(user, requestedBarbershopId) {
    if (user.role === 'admin') {
      return requestedBarbershopId || null;
    }

    return user.barbershopId;
  }

  scopedBody(body, user) {
    return {
      ...(body || {}),
      barbershopId: this.scopedBarbershopId(user, body?.barbershopId),
    };
  }

  login(body) {
    return this.barberShopService.login(body);
  }

  register(body, authHeader) {
    const user = this.getAuthenticatedUser(authHeader, ['admin']);
    if (user.error) return user;
    return this.barberShopService.registerOwner(body);
  }

  requestPasswordCode(body) {
    return this.barberShopService.requestPasswordCode(body);
  }

  verifyPasswordCode(body) {
    return this.barberShopService.verifyPasswordCode(body);
  }

  resetPassword(body) {
    return this.barberShopService.resetPassword(body);
  }

  getAdminSummary(authHeader) {
    const user = this.getAuthenticatedUser(authHeader, ['admin']);
    if (user.error) return user;
    return this.barberShopService.getAdminSummary();
  }

  listAdminBarbershops(authHeader) {
    const user = this.getAuthenticatedUser(authHeader, ['admin']);
    if (user.error) return user;
    return this.barberShopService.listAdminBarbershops();
  }

  updateAdminBarbershop(barbershopId, body, authHeader) {
    const user = this.getAuthenticatedUser(authHeader, ['admin']);
    if (user.error) return user;
    return this.barberShopService.updateAdminBarbershop(barbershopId, body);
  }

  getPublicBookingPage(slug) {
    return this.barberShopService.getPublicBookingPage(slug);
  }

  createPublicSchedule(slug, body) {
    return this.barberShopService.createPublicSchedule(slug, body);
  }

  getBarberShop(barbershopId, authHeader) {
    const user = this.getAuthenticatedUser(authHeader);
    if (user.error) return user;
    return this.barberShopService.getBarberShop(this.scopedBarbershopId(user, barbershopId));
  }

  updateBarberShop(body, authHeader) {
    const user = this.getAuthenticatedUser(authHeader, ['admin', 'owner']);
    if (user.error) return user;
    return this.barberShopService.updateBarberShop(this.scopedBody(body, user));
  }

  listProfessionals(barbershopId, authHeader) {
    const user = this.getAuthenticatedUser(authHeader);
    if (user.error) return user;
    return this.barberShopService.listProfessionals(this.scopedBarbershopId(user, barbershopId));
  }

  createProfessional(body, authHeader) {
    const user = this.getAuthenticatedUser(authHeader, ['admin', 'owner']);
    if (user.error) return user;
    return this.barberShopService.createProfessional(this.scopedBody(body, user));
  }

  updateProfessional(professionalId, body, authHeader) {
    const user = this.getAuthenticatedUser(authHeader, ['admin', 'owner']);
    if (user.error) return user;
    return this.barberShopService.updateProfessional(professionalId, this.scopedBody(body, user));
  }

  deleteProfessional(professionalId, authHeader) {
    const user = this.getAuthenticatedUser(authHeader, ['admin', 'owner']);
    if (user.error) return user;
    return this.barberShopService.deleteProfessional(professionalId, user);
  }

  listUsers(barbershopId, authHeader) {
    const user = this.getAuthenticatedUser(authHeader, ['admin', 'owner']);
    if (user.error) return user;
    return this.barberShopService.listUsers(this.scopedBarbershopId(user, barbershopId));
  }

  updateUser(userId, body, authHeader) {
    const user = this.getAuthenticatedUser(authHeader, ['admin', 'owner']);
    if (user.error) return user;
    return this.barberShopService.updateUser(userId, this.scopedBody(body, user), user);
  }

  listServices(barbershopId, authHeader) {
    const user = this.getAuthenticatedUser(authHeader);
    if (user.error) return user;
    return this.barberShopService.listServices(this.scopedBarbershopId(user, barbershopId));
  }

  createService(body, authHeader) {
    const user = this.getAuthenticatedUser(authHeader, ['admin', 'owner']);
    if (user.error) return user;
    return this.barberShopService.createService(this.scopedBody(body, user));
  }

  deleteService(serviceId, authHeader) {
    const user = this.getAuthenticatedUser(authHeader, ['admin', 'owner']);
    if (user.error) return user;
    return this.barberShopService.deleteService(serviceId, user);
  }

  createAppointment(body, authHeader) {
    const user = this.getAuthenticatedUser(authHeader);
    if (user.error) return user;
    return this.barberShopService.createAppointment(this.scopedBody(body, user), user);
  }

  listAppointments(barbershopId, authHeader) {
    const user = this.getAuthenticatedUser(authHeader);
    if (user.error) return user;
    return this.barberShopService.listAppointments(this.scopedBarbershopId(user, barbershopId), user);
  }

  deleteAppointment(appointmentId, authHeader) {
    const user = this.getAuthenticatedUser(authHeader);
    if (user.error) return user;
    return this.barberShopService.deleteAppointment(appointmentId, user);
  }

  listSchedules(barbershopId, authHeader) {
    const user = this.getAuthenticatedUser(authHeader);
    if (user.error) return user;
    return this.barberShopService.listSchedules(this.scopedBarbershopId(user, barbershopId), user);
  }

  createSchedule(body, authHeader) {
    const user = this.getAuthenticatedUser(authHeader);
    if (user.error) return user;
    return this.barberShopService.createSchedule(this.scopedBody(body, user), user);
  }

  deleteSchedule(scheduleId, authHeader) {
    const user = this.getAuthenticatedUser(authHeader);
    if (user.error) return user;
    return this.barberShopService.deleteSchedule(scheduleId, user);
  }

  listCosts(barbershopId, authHeader) {
    const user = this.getAuthenticatedUser(authHeader, ['admin', 'owner']);
    if (user.error) return user;
    return this.barberShopService.listCosts(this.scopedBarbershopId(user, barbershopId));
  }

  createCost(body, authHeader) {
    const user = this.getAuthenticatedUser(authHeader, ['admin', 'owner']);
    if (user.error) return user;
    return this.barberShopService.createCost(this.scopedBody(body, user));
  }

  updateCost(costId, body, authHeader) {
    const user = this.getAuthenticatedUser(authHeader, ['admin', 'owner']);
    if (user.error) return user;
    return this.barberShopService.updateCost(costId, this.scopedBody(body, user), user);
  }

  deleteCost(costId, authHeader) {
    const user = this.getAuthenticatedUser(authHeader, ['admin', 'owner']);
    if (user.error) return user;
    return this.barberShopService.deleteCost(costId, user);
  }

  getDailyReport(date, authHeader) {
    const user = this.getAuthenticatedUser(authHeader);
    if (user.error) return user;
    return this.barberShopService.getReport({ period: 'daily', date, barbershopId: user.barbershopId, user });
  }

  getMonthlyReport(month, authHeader) {
    const user = this.getAuthenticatedUser(authHeader);
    if (user.error) return user;
    return this.barberShopService.getReport({ period: 'monthly', month, barbershopId: user.barbershopId, user });
  }

  getProfessionalCommission(professionalId, month, authHeader) {
    const user = this.getAuthenticatedUser(authHeader);
    if (user.error) return user;
    return this.barberShopService.getProfessionalCommission({
      professionalId,
      month,
      user,
    });
  }
}

Inject(BarberShopService)(AppController, undefined, 0);
Controller()(AppController);

Post('auth/login')(AppController.prototype, 'login', Object.getOwnPropertyDescriptor(AppController.prototype, 'login'));
Body()(AppController.prototype, 'login', 0);

Post('auth/register')(AppController.prototype, 'register', Object.getOwnPropertyDescriptor(AppController.prototype, 'register'));
Body()(AppController.prototype, 'register', 0);
Headers('authorization')(AppController.prototype, 'register', 1);

Post('auth/forgot-password/request-code')(AppController.prototype, 'requestPasswordCode', Object.getOwnPropertyDescriptor(AppController.prototype, 'requestPasswordCode'));
Body()(AppController.prototype, 'requestPasswordCode', 0);

Post('auth/forgot-password/verify-code')(AppController.prototype, 'verifyPasswordCode', Object.getOwnPropertyDescriptor(AppController.prototype, 'verifyPasswordCode'));
Body()(AppController.prototype, 'verifyPasswordCode', 0);

Post('auth/forgot-password/reset')(AppController.prototype, 'resetPassword', Object.getOwnPropertyDescriptor(AppController.prototype, 'resetPassword'));
Body()(AppController.prototype, 'resetPassword', 0);

Get('admin/summary')(AppController.prototype, 'getAdminSummary', Object.getOwnPropertyDescriptor(AppController.prototype, 'getAdminSummary'));
Headers('authorization')(AppController.prototype, 'getAdminSummary', 0);
Get('admin/barbershops')(AppController.prototype, 'listAdminBarbershops', Object.getOwnPropertyDescriptor(AppController.prototype, 'listAdminBarbershops'));
Headers('authorization')(AppController.prototype, 'listAdminBarbershops', 0);
Post('admin/barbershops/:barbershopId')(AppController.prototype, 'updateAdminBarbershop', Object.getOwnPropertyDescriptor(AppController.prototype, 'updateAdminBarbershop'));
Param('barbershopId')(AppController.prototype, 'updateAdminBarbershop', 0);
Body()(AppController.prototype, 'updateAdminBarbershop', 1);
Headers('authorization')(AppController.prototype, 'updateAdminBarbershop', 2);

Get('public/barbershops/:slug')(AppController.prototype, 'getPublicBookingPage', Object.getOwnPropertyDescriptor(AppController.prototype, 'getPublicBookingPage'));
Param('slug')(AppController.prototype, 'getPublicBookingPage', 0);
Post('public/barbershops/:slug/schedules')(AppController.prototype, 'createPublicSchedule', Object.getOwnPropertyDescriptor(AppController.prototype, 'createPublicSchedule'));
Param('slug')(AppController.prototype, 'createPublicSchedule', 0);
Body()(AppController.prototype, 'createPublicSchedule', 1);

Get('barbershop')(AppController.prototype, 'getBarberShop', Object.getOwnPropertyDescriptor(AppController.prototype, 'getBarberShop'));
Query('barbershopId')(AppController.prototype, 'getBarberShop', 0);
Headers('authorization')(AppController.prototype, 'getBarberShop', 1);
Post('barbershop')(AppController.prototype, 'updateBarberShop', Object.getOwnPropertyDescriptor(AppController.prototype, 'updateBarberShop'));
Body()(AppController.prototype, 'updateBarberShop', 0);
Headers('authorization')(AppController.prototype, 'updateBarberShop', 1);

Get('professionals')(AppController.prototype, 'listProfessionals', Object.getOwnPropertyDescriptor(AppController.prototype, 'listProfessionals'));
Query('barbershopId')(AppController.prototype, 'listProfessionals', 0);
Headers('authorization')(AppController.prototype, 'listProfessionals', 1);
Post('professionals')(AppController.prototype, 'createProfessional', Object.getOwnPropertyDescriptor(AppController.prototype, 'createProfessional'));
Body()(AppController.prototype, 'createProfessional', 0);
Headers('authorization')(AppController.prototype, 'createProfessional', 1);
Post('professionals/:professionalId')(AppController.prototype, 'updateProfessional', Object.getOwnPropertyDescriptor(AppController.prototype, 'updateProfessional'));
Param('professionalId')(AppController.prototype, 'updateProfessional', 0);
Body()(AppController.prototype, 'updateProfessional', 1);
Headers('authorization')(AppController.prototype, 'updateProfessional', 2);
Post('professionals/:professionalId/delete')(AppController.prototype, 'deleteProfessional', Object.getOwnPropertyDescriptor(AppController.prototype, 'deleteProfessional'));
Param('professionalId')(AppController.prototype, 'deleteProfessional', 0);
Headers('authorization')(AppController.prototype, 'deleteProfessional', 1);

Get('users')(AppController.prototype, 'listUsers', Object.getOwnPropertyDescriptor(AppController.prototype, 'listUsers'));
Query('barbershopId')(AppController.prototype, 'listUsers', 0);
Headers('authorization')(AppController.prototype, 'listUsers', 1);
Post('users/:userId')(AppController.prototype, 'updateUser', Object.getOwnPropertyDescriptor(AppController.prototype, 'updateUser'));
Param('userId')(AppController.prototype, 'updateUser', 0);
Body()(AppController.prototype, 'updateUser', 1);
Headers('authorization')(AppController.prototype, 'updateUser', 2);

Get('services')(AppController.prototype, 'listServices', Object.getOwnPropertyDescriptor(AppController.prototype, 'listServices'));
Query('barbershopId')(AppController.prototype, 'listServices', 0);
Headers('authorization')(AppController.prototype, 'listServices', 1);
Post('services')(AppController.prototype, 'createService', Object.getOwnPropertyDescriptor(AppController.prototype, 'createService'));
Body()(AppController.prototype, 'createService', 0);
Headers('authorization')(AppController.prototype, 'createService', 1);
Post('services/:serviceId/delete')(AppController.prototype, 'deleteService', Object.getOwnPropertyDescriptor(AppController.prototype, 'deleteService'));
Param('serviceId')(AppController.prototype, 'deleteService', 0);
Headers('authorization')(AppController.prototype, 'deleteService', 1);

Get('appointments')(AppController.prototype, 'listAppointments', Object.getOwnPropertyDescriptor(AppController.prototype, 'listAppointments'));
Query('barbershopId')(AppController.prototype, 'listAppointments', 0);
Headers('authorization')(AppController.prototype, 'listAppointments', 1);
Post('appointments')(AppController.prototype, 'createAppointment', Object.getOwnPropertyDescriptor(AppController.prototype, 'createAppointment'));
Body()(AppController.prototype, 'createAppointment', 0);
Headers('authorization')(AppController.prototype, 'createAppointment', 1);
Post('appointments/:appointmentId/delete')(AppController.prototype, 'deleteAppointment', Object.getOwnPropertyDescriptor(AppController.prototype, 'deleteAppointment'));
Param('appointmentId')(AppController.prototype, 'deleteAppointment', 0);
Headers('authorization')(AppController.prototype, 'deleteAppointment', 1);

Get('schedules')(AppController.prototype, 'listSchedules', Object.getOwnPropertyDescriptor(AppController.prototype, 'listSchedules'));
Query('barbershopId')(AppController.prototype, 'listSchedules', 0);
Headers('authorization')(AppController.prototype, 'listSchedules', 1);
Post('schedules')(AppController.prototype, 'createSchedule', Object.getOwnPropertyDescriptor(AppController.prototype, 'createSchedule'));
Body()(AppController.prototype, 'createSchedule', 0);
Headers('authorization')(AppController.prototype, 'createSchedule', 1);
Post('schedules/:scheduleId/delete')(AppController.prototype, 'deleteSchedule', Object.getOwnPropertyDescriptor(AppController.prototype, 'deleteSchedule'));
Param('scheduleId')(AppController.prototype, 'deleteSchedule', 0);
Headers('authorization')(AppController.prototype, 'deleteSchedule', 1);

Get('costs')(AppController.prototype, 'listCosts', Object.getOwnPropertyDescriptor(AppController.prototype, 'listCosts'));
Query('barbershopId')(AppController.prototype, 'listCosts', 0);
Headers('authorization')(AppController.prototype, 'listCosts', 1);
Post('costs')(AppController.prototype, 'createCost', Object.getOwnPropertyDescriptor(AppController.prototype, 'createCost'));
Body()(AppController.prototype, 'createCost', 0);
Headers('authorization')(AppController.prototype, 'createCost', 1);
Post('costs/:costId')(AppController.prototype, 'updateCost', Object.getOwnPropertyDescriptor(AppController.prototype, 'updateCost'));
Param('costId')(AppController.prototype, 'updateCost', 0);
Body()(AppController.prototype, 'updateCost', 1);
Headers('authorization')(AppController.prototype, 'updateCost', 2);
Post('costs/:costId/delete')(AppController.prototype, 'deleteCost', Object.getOwnPropertyDescriptor(AppController.prototype, 'deleteCost'));
Param('costId')(AppController.prototype, 'deleteCost', 0);
Headers('authorization')(AppController.prototype, 'deleteCost', 1);

Get('reports/daily')(AppController.prototype, 'getDailyReport', Object.getOwnPropertyDescriptor(AppController.prototype, 'getDailyReport'));
Query('date')(AppController.prototype, 'getDailyReport', 0);
Headers('authorization')(AppController.prototype, 'getDailyReport', 1);

Get('reports/monthly')(AppController.prototype, 'getMonthlyReport', Object.getOwnPropertyDescriptor(AppController.prototype, 'getMonthlyReport'));
Query('month')(AppController.prototype, 'getMonthlyReport', 0);
Headers('authorization')(AppController.prototype, 'getMonthlyReport', 1);

Get('professionals/:professionalId/commission')(AppController.prototype, 'getProfessionalCommission', Object.getOwnPropertyDescriptor(AppController.prototype, 'getProfessionalCommission'));
Param('professionalId')(AppController.prototype, 'getProfessionalCommission', 0);
Query('month')(AppController.prototype, 'getProfessionalCommission', 1);
Headers('authorization')(AppController.prototype, 'getProfessionalCommission', 2);

module.exports = { AppController };