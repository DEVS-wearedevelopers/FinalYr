import { InstitutionsRepository } from './institutions.repository.js';
import { InstitutionsService } from './institutions.service.js';
import { createInstitutionsController } from './institutions.controller.js';

const repository = new InstitutionsRepository();
const service = new InstitutionsService(repository);
export const institutionsRouter = createInstitutionsController(service);
