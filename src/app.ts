import express from 'express';
import { errorHandler } from './middlewares/error-handler';
import { NotFoundError } from './errors/not-found-error';

const app = express();

app.use(express.json());

app.all('*', async (req, res, next) => {
    throw new NotFoundError()
})

app.use(errorHandler);

export { app };