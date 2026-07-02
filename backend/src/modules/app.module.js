const { Module } = require('@nestjs/common');
const { AppController } = require('../presentation/app.controller');
const { BarberShopService } = require('../services/barbershop.service');

class AppModule {}

Module({
  controllers: [AppController],
  providers: [BarberShopService],
})(AppModule);

module.exports = { AppModule };
