import "reflect-metadata";
import * as express from "express";
import * as cors from "cors";
import { createConnection } from "typeorm";
import * as amqp from "amqplib/callback_api"
import { Product } from "./entity/Product";
import { Connection } from "amqplib/callback_api";

createConnection().then((db) => {

  amqp.connect("amqps://qwewqwqe:wqeqwewqewqeqwe@sparrow.rmq.cloudamqp.om/qweqwe", (error: Error, channel: Connection) => {
    if (error) {
      throw error;
    }

    channel.createChannel((error, channel) => {
      if (error) {
        throw error;
      }

      const app = express();

      const productRepository = db.getRepository(Product);
      console.log('Database Connected :)');
      app.use(cors({
        origin: ["http://localhost:3000", "http://localhost:8080", "http://localhost:4200"]
      }));

      app.use(express.json());

      app.get("/api/product", async (req: express.Request, res: express.Response) => {
        const products = await productRepository.find();
        channel.sendToQueue("hello", Buffer.from("hello"));
        res.json(products);
      });

      app.get("api/product/:id", async (req: express.Request, res: express.Response) => {
        const product = productRepository.create(req.body);
        const result = await productRepository.save(product);
        return res.send(result);
      });

      app.post("/api/products", async (req: express.Request, res: express.Response) => {
        const product = productRepository.create(req.body);
        const result = await productRepository.save(product);
        channel.sendToQueue("product_created", Buffer.from(JSON.stringify(result)));
        return res.send(result);
      });


      app.put("/api/products/:id", async (req: express.Request, res: express.Response) => {
        const product = await productRepository.findOne(req.params.id);
        productRepository.merge(product, req.body);
        const result = await productRepository.save(product);
        channel.sendToQueue("product_updated", Buffer.from(JSON.stringify(result)));
        return res.send(result);
      });

      app.delete("/api/products/:id", async (req: express.Request, res: express.Response) => {
        const result = await productRepository.delete(req.params.id);
        channel.sendToQueue("product_updated", Buffer.from(req.params.id));
        return res.send(result);
      });

      app.post("/api/product/:id/like", async (req: express.Request, res: express.Response) => {
        const product = await productRepository.findOne(req.params.id);
        product.likes++;
        const result = await productRepository.save(product);
        return res.send(result);
      });

      app.listen(8080, () => {
        console.log(`Listening to port: 8080`)
      });
      process.on("beforeExit", () => {
        console.log("close");
        channel.close((e: Error) => {
          console.log(e);
        });
      });
    });
  });

}).catch((e: Error) => {
  console.log(e);
});
