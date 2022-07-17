import { Router } from 'express';
import dotenv from 'dotenv';

import RewardsDebitController from './app/controllers/RewardsDebitController.js';

dotenv.config();
const Routes = new Router();

Routes.get('/', (req, res) => res.send('Rewards-DebitAPI - Endpoint padrão!'));

Routes.post(`/points`, RewardsDebitController.store);


export default Routes;