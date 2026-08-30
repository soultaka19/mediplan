import { HttpStatus, Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Response } from 'express';
import { DataSource } from 'typeorm';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let dataSource: jest.Mocked<Pick<DataSource, 'query'>>;
  let res: jest.Mocked<Pick<Response, 'status'>>;
  let loggerError: jest.SpyInstance;

  beforeEach(async () => {
    dataSource = { query: jest.fn() };
    res = { status: jest.fn() };
    // L'échec de la sonde est journalisé : on évite le bruit dans la sortie des tests.
    loggerError = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: DataSource, useValue: dataSource }],
    }).compile();

    controller = module.get(HealthController);
  });

  afterEach(() => {
    loggerError.mockRestore();
  });

  it('GET /health -> 200 { status: ok } quand la base repond au SELECT 1', async () => {
    dataSource.query.mockResolvedValue([{ '?column?': 1 }]);

    const result = await controller.check(res as unknown as Response);

    expect(dataSource.query.mock.calls[0]).toEqual(['SELECT 1']);
    expect(result.status).toBe('ok');
    expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false);
    expect(res.status.mock.calls).toHaveLength(0);
    expect(loggerError.mock.calls).toHaveLength(0);
  });

  it('GET /health -> 503 { status: error } quand la base est injoignable', async () => {
    dataSource.query.mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:5432'));

    const result = await controller.check(res as unknown as Response);

    expect(res.status.mock.calls[0]).toEqual([HttpStatus.SERVICE_UNAVAILABLE]);
    expect(result.status).toBe('error');
    expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false);
    // L'erreur réelle est journalisée côté serveur, jamais renvoyée au client.
    expect(loggerError.mock.calls).toHaveLength(1);
    expect(JSON.stringify(result)).not.toContain('ECONNREFUSED');
  });
});
