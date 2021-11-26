import "reflect-metadata";
import * as express from "express";
import * as cors from "cors";
import { createConnection } from "typeorm";
import * as amqp from "amqplib/callback_api";
import { Channel, Connection } from "amqplib/callback_api";
import { Product } from "../entity/Product";
import axios from "axios";

createConnection().then((db) => {
  const productRepository = db.getRepository(Product);
  amqp.connect("amqps://qwewqwqe:wqeqwewqewqeqwe@sparrow.rmq.cloudamqp.om/qweqwe", (error: Error, channel: Connection) => {
    if (error) {
      throw error;
    }

    channel.createChannel((error: Error, channel: Channel) => {
      if (error) {
        throw error;
      }

      channel.assertQueue("product_created", { durable: false }); // queue connection
      channel.assertQueue("product_updated", { durable: false }); // queue connection
      channel.assertQueue("product_deleted", { durable: false }); // queue connection

      const app = express();

      app.use(cors({
        origin: ["http://localhost:3000", "http://localhost:8080", "http://localhost:4200"]
      }));

      app.use(express.json());

      channel.consume("product_created", async (msg) => {
        const eventProduct: Product = JSON.parse(msg.content.toString());
        const product = new Product();
        product.admin_id = parseInt(eventProduct.id)
        product.title = eventProduct.title
        product.image = eventProduct.image
        product.likes = eventProduct.likes
        await productRepository.save(product);
        console.log("product created..");
      }, { noAck: true }); // consumed data

      channel.consume("product_updated", async (msg) => {
        console.log(msg.content.toString());
        const eventProduct: Product = JSON.parse(msg.content.toString());
        const product = await productRepository.findOne({ admin_id: parseInt(eventProduct.id) });
        productRepository.merge(product, {
          title: eventProduct.title,
          image: eventProduct.image,
          likes: eventProduct.likes
        });
        await productRepository.save(product);
        console.log("product updated..");
      });

      channel.consume("product_deleted", async (msg) => {
        console.log(msg.content.toString());
        const admin_id = parseInt(msg.content.toString());
        await productRepository.delete({ admin_id })
      });

      app.get("/api/products", async (req: express.Request, res: express.Response) => {
        const products = await productRepository.find();
        return res.send(products);
      });

      app.post("/api/products/:id/like", async (req: express.Request, res: express.Response) => {
        const product = await productRepository.findOne(req.params.id);
        await axios.post(`http://localhost:8080/api/products/${product.admin_id}/like`, {});
        product.likes++;
        await productRepository.save(product);
        return res.send(product);
      });

      app.listen(8081, () => {
        console.log(`Listening to port: 8081`)
      });

      process.on("beforeExit", () => {
        console.log("close");
        channel.close((e: Error) => {
          console.log(e);
        });
      })

    });
  });
});
