const {
  Body,
  Controller,
  Get,
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

  login(body) {
    return this.barberShopService.login(body);
  }

  register(body) {
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

  getAdminSummary() {
    return this.barberShopService.getAdminSummary();
  }

  listAdminBarbershops() {
    return this.barberShopService.listAdminBarbershops();
  }

  updateAdminBarbershop(barbershopId, body) {
    return this.barberShopService.updateAdminBarbershop(barbershopId, body);
  }

  getBarberShop(barbershopId) {
    return this.barberShopService.getBarberShop(barbershopId);
  }

  updateBarberShop(body) {
    return this.barberShopService.updateBarberShop(body);
  }

  listProfessionals(barbershopId) {
    return this.barberShopService.listProfessionals(barbershopId);
  }

  createProfessional(body) {
    return this.barberShopService.createProfessional(body);
  }

  updateProfessional(professionalId, body) {
    return this.barberShopService.updateProfessional(professionalId, body);
  }

  deleteProfessional(professionalId) {
    return this.barberShopService.deleteProfessional(professionalId);
  }

  listUsers(barbershopId) {
    return this.barberShopService.listUsers(barbershopId);
  }

  updateUser(userId, body) {
    return this.barberShopService.updateUser(userId, body);
  }

  listServices(barbershopId) {
    return this.barberShopService.listServices(barbershopId);
  }

  createService(body) {
    return this.barberShopService.createService(body);
  }

  deleteService(serviceId) {
    return this.barberShopService.deleteService(serviceId);
  }

  createAppointment(body) {
    return this.barberShopService.createAppointment(body);
  }

  listAppointments(barbershopId) {
    return this.barberShopService.listAppointments(barbershopId);
  }

  listSchedules(barbershopId) {
    return this.barberShopService.listSchedules(barbershopId);
  }

  createSchedule(body) {
    return this.barberShopService.createSchedule(body);
  }

  deleteSchedule(scheduleId) {
    return this.barberShopService.deleteSchedule(scheduleId);
  }

  listCosts(barbershopId) {
    return this.barberShopService.listCosts(barbershopId);
  }

  createCost(body) {
    return this.barberShopService.createCost(body);
  }

  updateCost(costId, body) {
    return this.barberShopService.updateCost(costId, body);
  }

  deleteCost(costId) {
    return this.barberShopService.deleteCost(costId);
  }

  getDailyReport(date) {
    return this.barberShopService.getReport({ period: 'daily', date });
  }

  getMonthlyReport(month) {
    return this.barberShopService.getReport({ period: 'monthly', month });
  }

  getProfessionalCommission(professionalId, month) {
    return this.barberShopService.getProfessionalCommission({
      professionalId,
      month,
    });
  }
}

Inject(BarberShopService)(AppController, undefined, 0);
Controller()(AppController);

Post('auth/login')(AppController.prototype, 'login', Object.getOwnPropertyDescriptor(AppController.prototype, 'login'));
Body()(AppController.prototype, 'login', 0);

Post('auth/register')(AppController.prototype, 'register', Object.getOwnPropertyDescriptor(AppController.prototype, 'register'));
Body()(AppController.prototype, 'register', 0);

Post('auth/forgot-password/request-code')(AppController.prototype, 'requestPasswordCode', Object.getOwnPropertyDescriptor(AppController.prototype, 'requestPasswordCode'));
Body()(AppController.prototype, 'requestPasswordCode', 0);

Post('auth/forgot-password/verify-code')(AppController.prototype, 'verifyPasswordCode', Object.getOwnPropertyDescriptor(AppController.prototype, 'verifyPasswordCode'));
Body()(AppController.prototype, 'verifyPasswordCode', 0);

Post('auth/forgot-password/reset')(AppController.prototype, 'resetPassword', Object.getOwnPropertyDescriptor(AppController.prototype, 'resetPassword'));
Body()(AppController.prototype, 'resetPassword', 0);

Get('admin/summary')(AppController.prototype, 'getAdminSummary', Object.getOwnPropertyDescriptor(AppController.prototype, 'getAdminSummary'));
Get('admin/barbershops')(AppController.prototype, 'listAdminBarbershops', Object.getOwnPropertyDescriptor(AppController.prototype, 'listAdminBarbershops'));
Post('admin/barbershops/:barbershopId')(AppController.prototype, 'updateAdminBarbershop', Object.getOwnPropertyDescriptor(AppController.prototype, 'updateAdminBarbershop'));
Param('barbershopId')(AppController.prototype, 'updateAdminBarbershop', 0);
Body()(AppController.prototype, 'updateAdminBarbershop', 1);

Get('barbershop')(AppController.prototype, 'getBarberShop', Object.getOwnPropertyDescriptor(AppController.prototype, 'getBarberShop'));
Query('barbershopId')(AppController.prototype, 'getBarberShop', 0);
Post('barbershop')(AppController.prototype, 'updateBarberShop', Object.getOwnPropertyDescriptor(AppController.prototype, 'updateBarberShop'));
Body()(AppController.prototype, 'updateBarberShop', 0);

Get('professionals')(AppController.prototype, 'listProfessionals', Object.getOwnPropertyDescriptor(AppController.prototype, 'listProfessionals'));
Query('barbershopId')(AppController.prototype, 'listProfessionals', 0);
Post('professionals')(AppController.prototype, 'createProfessional', Object.getOwnPropertyDescriptor(AppController.prototype, 'createProfessional'));
Body()(AppController.prototype, 'createProfessional', 0);
Post('professionals/:professionalId')(AppController.prototype, 'updateProfessional', Object.getOwnPropertyDescriptor(AppController.prototype, 'updateProfessional'));
Param('professionalId')(AppController.prototype, 'updateProfessional', 0);
Body()(AppController.prototype, 'updateProfessional', 1);
Post('professionals/:professionalId/delete')(AppController.prototype, 'deleteProfessional', Object.getOwnPropertyDescriptor(AppController.prototype, 'deleteProfessional'));
Param('professionalId')(AppController.prototype, 'deleteProfessional', 0);

Get('users')(AppController.prototype, 'listUsers', Object.getOwnPropertyDescriptor(AppController.prototype, 'listUsers'));
Query('barbershopId')(AppController.prototype, 'listUsers', 0);
Post('users/:userId')(AppController.prototype, 'updateUser', Object.getOwnPropertyDescriptor(AppController.prototype, 'updateUser'));
Param('userId')(AppController.prototype, 'updateUser', 0);
Body()(AppController.prototype, 'updateUser', 1);

Get('services')(AppController.prototype, 'listServices', Object.getOwnPropertyDescriptor(AppController.prototype, 'listServices'));
Query('barbershopId')(AppController.prototype, 'listServices', 0);
Post('services')(AppController.prototype, 'createService', Object.getOwnPropertyDescriptor(AppController.prototype, 'createService'));
Body()(AppController.prototype, 'createService', 0);
Post('services/:serviceId/delete')(AppController.prototype, 'deleteService', Object.getOwnPropertyDescriptor(AppController.prototype, 'deleteService'));
Param('serviceId')(AppController.prototype, 'deleteService', 0);

Get('appointments')(AppController.prototype, 'listAppointments', Object.getOwnPropertyDescriptor(AppController.prototype, 'listAppointments'));
Query('barbershopId')(AppController.prototype, 'listAppointments', 0);
Post('appointments')(AppController.prototype, 'createAppointment', Object.getOwnPropertyDescriptor(AppController.prototype, 'createAppointment'));
Body()(AppController.prototype, 'createAppointment', 0);

Get('schedules')(AppController.prototype, 'listSchedules', Object.getOwnPropertyDescriptor(AppController.prototype, 'listSchedules'));
Query('barbershopId')(AppController.prototype, 'listSchedules', 0);
Post('schedules')(AppController.prototype, 'createSchedule', Object.getOwnPropertyDescriptor(AppController.prototype, 'createSchedule'));
Body()(AppController.prototype, 'createSchedule', 0);
Post('schedules/:scheduleId/delete')(AppController.prototype, 'deleteSchedule', Object.getOwnPropertyDescriptor(AppController.prototype, 'deleteSchedule'));
Param('scheduleId')(AppController.prototype, 'deleteSchedule', 0);

Get('costs')(AppController.prototype, 'listCosts', Object.getOwnPropertyDescriptor(AppController.prototype, 'listCosts'));
Query('barbershopId')(AppController.prototype, 'listCosts', 0);
Post('costs')(AppController.prototype, 'createCost', Object.getOwnPropertyDescriptor(AppController.prototype, 'createCost'));
Body()(AppController.prototype, 'createCost', 0);
Post('costs/:costId')(AppController.prototype, 'updateCost', Object.getOwnPropertyDescriptor(AppController.prototype, 'updateCost'));
Param('costId')(AppController.prototype, 'updateCost', 0);
Body()(AppController.prototype, 'updateCost', 1);
Post('costs/:costId/delete')(AppController.prototype, 'deleteCost', Object.getOwnPropertyDescriptor(AppController.prototype, 'deleteCost'));
Param('costId')(AppController.prototype, 'deleteCost', 0);

Get('reports/daily')(AppController.prototype, 'getDailyReport', Object.getOwnPropertyDescriptor(AppController.prototype, 'getDailyReport'));
Query('date')(AppController.prototype, 'getDailyReport', 0);

Get('reports/monthly')(AppController.prototype, 'getMonthlyReport', Object.getOwnPropertyDescriptor(AppController.prototype, 'getMonthlyReport'));
Query('month')(AppController.prototype, 'getMonthlyReport', 0);

Get('professionals/:professionalId/commission')(AppController.prototype, 'getProfessionalCommission', Object.getOwnPropertyDescriptor(AppController.prototype, 'getProfessionalCommission'));
Param('professionalId')(AppController.prototype, 'getProfessionalCommission', 0);
Query('month')(AppController.prototype, 'getProfessionalCommission', 1);

module.exports = { AppController };
