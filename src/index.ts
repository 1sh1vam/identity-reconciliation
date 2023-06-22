import { app } from "./app";

const start = async () => {
    app.listen(3000, () => {
        console.log('Server started on port 3000');
    });
}

start();