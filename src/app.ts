import express from 'express';
import 'express-async-errors';
import cors from 'cors';
import { errorHandler } from './middlewares/error-handler';
import { NotFoundError } from './errors/not-found-error';
import { identifyRouter } from './routes/identify';

const app = express();

app.use(cors());
app.use(express.json());

app.use(identifyRouter);

app.all('*', async (req, res, next) => {
    throw new NotFoundError()
})

app.use(errorHandler);

export { app };