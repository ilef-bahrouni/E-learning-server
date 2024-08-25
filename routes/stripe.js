// const express = require("express");
// const Stripe = require("stripe");
import Stripe from "stripe";
import express from "express"; 
// const { Order } = require("../models/Order");

// require("dotenv").config();
import dotenv from 'dotenv';
import { User } from "../models/User.js";

dotenv.config(); // Ensure environment variables are loaded

// const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // Use secret key for server-side

// const stripe = Stripe(process.env.STRIPE_PUBLIC_KEY);
const stripe = Stripe("sk_test_51MBPevKNrVArcxobIs9Bi2a3VOj4FK18ZRs4wDO0FrEjR2S9CM3GwR7JgnH71gVgLpDFmDLtLWZm1ooe9jZpEJwM00XdSqzGug");


const router = express.Router();

router.post("/create-checkout-session", async (req, res) => {
  // const user = req.body.user;

      // user = await User.findById(req.user._id);
       const user = await User.findById(req.body.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
    }
  if (user.role === 'admin') {
    return next(new ErrorHandler("Admin can't create a subscription", 400));
  }

  const customer = await stripe.customers.create({
    metadata: {
        userId: req.body.userId,

    
      // cart: JSON.stringify(req.body.cartItems),
    },
  });

  
  const line_items = [
    {
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'offre standard offer per month',
          description: 'Subscription for the standard offer per month',
        },
        unit_amount: 29900, // $299.00 in cents
      },
      quantity: 1,
    },
  ];
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    // shipping_address_collection: {
    //   allowed_countries: ["US","DT",  "CA", "KE"],
    // },
    // shipping_options: [
    //   {
    //     shipping_rate_data: {
    //       type: "fixed_amount",
    //       fixed_amount: {
    //         amount: 0,
    //         currency: "usd",
    //       },
    //       display_name: "Free shipping",
    //       // Delivers between 5-7 business days
    //       delivery_estimate: {
    //         minimum: {
    //           unit: "business_day",
    //           value: 5,
    //         },
    //         maximum: {
    //           unit: "business_day",
    //           value: 7,
    //         },
    //       },
    //     },
    //   },
    //   {
    //     shipping_rate_data: {
    //       type: "fixed_amount",
    //       fixed_amount: {
    //         amount: 1500,
    //         currency: "usd",
    //       },
    //       display_name: "Next day air",
    //       // Delivers in exactly 1 business day
    //       delivery_estimate: {
    //         minimum: {
    //           unit: "business_day",
    //           value: 1,
    //         },
    //         maximum: {
    //           unit: "business_day",
    //           value: 1,
    //         },
    //       },
    //     },
    //   },
    // ],
    phone_number_collection: {
      enabled: true,
    },
    line_items,
    mode: "payment",
    customer: customer.id,
    // success_url: `http://localhost:3000/paymentsuccess`,
    success_url: `${process.env.FRONTEND_URL}/paymentsuccess?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `http://localhost:3000/subscribe`,
  });

 // Créer l'abonnement  for this user  


// user.subscription.id = customer.id;
// user.subscription.status = customer.status;

await user.save();

// res.status(201).json({
//     success: true,
//     subscriptionId: customer.id,
// });
   
   res.send({ url: session.url });
});


// Route pour vérifier et mettre à jour l'abonnement après le paiement réussi
router.post("/payment-success", async (req, res, next) => {
  const { session_id } = req.query;
  const session = await stripe.checkout.sessions.retrieve(session_id);

  if (!session || session.payment_status !== 'paid') {
      return res.status(400).json({ message: "Payment not successful" });
  }

  const user = await User.findOne({ 'subscription.id': session.customer });

  if (!user) {
      return res.status(404).json({ message: "User not found" });
  }

  const now = new Date();
  const expiryDate = new Date(now.setMonth(now.getMonth() + 1)); // L'abonnement expire dans un mois

  user.subscription = {
      id: session.customer,
      status: 'active',
      expiryDate: expiryDate
  };

  await user.save();

  res.status(200).json({ success: true, message: "Subscription updated successfully" });
}) ; 

// Create order function 

// const createOrder = async (customer, data) => {
//   const Items = JSON.parse(customer.metadata.cart);

//   const products = Items.map((item) => {
//     return {
//       productId: item.id,
//       quantity: item.cartQuantity,
//     };
//   });

//   const newOrder = new Order({
//     userId: customer.metadata.userId,
//     customerId: data.customer,
//     paymentIntentId: data.payment_intent,
//     products,
//     subtotal: data.amount_subtotal,
//     total: data.amount_total,
//     shipping: data.customer_details,
//     payment_status: data.payment_status,
//   });

//   try {
//     const savedOrder = await newOrder.save();
//     console.log("Processed Order:", savedOrder);
//   } catch (err) {
//     console.log(err);
//   }
// };


// Endpoint Webhook 

router.post(
  "/webhook",
  express.json({ type: "application/json" }),
  async (req, res) => {
    let data;
    let eventType;
     console.log (' start payement validation ')

    // Check if webhook signing is configured.
    let webhookSecret;
    //webhookSecret = process.env.STRIPE_WEB_HOOK;

    if (webhookSecret) {
      // Retrieve the event by verifying the signature using the raw body and secret.
      let event;
      let signature = req.headers["stripe-signature"];

      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          signature,
          webhookSecret
        );
      } catch (err) {
        console.log(`⚠️  Webhook signature verification failed:  ${err}`);
        return res.sendStatus(400);
      }
      // Extract the object from the event.
      data = event.data.object;
      eventType = event.type;
    } else {
      // Webhook signing is recommended, but if the secret is not configured in `config.js`,
      // retrieve the event data directly from the request body.
      data = req.body.data.object;
      eventType = req.body.type;
    }

    // Handle the checkout.session.completed event
    // if (eventType === "checkout.session.completed") {
    //   stripe.customers
    //     .retrieve(data.customer)
    //     .then(async (customer) => {
    //       try {
    //         // CREATE ORDER
    //          console.log ('supscription .....')
    //         // createOrder(customer, data);
    //       } catch (err) {
    //         console.log(typeof createOrder);
    //         console.log(err);
    //       }
    //     })
    //     .catch((err) => console.log(err.message));
    // }
    // Gérer les événements spécifiques
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Mettre à jour la base de données avec les informations de l'abonnement
    const user = await User.findOne({ 'subscription.id': session.customer });

    if (user) {
        const now = new Date();
        const expiryDate = new Date(now.setMonth(now.getMonth() + 1));

        user.subscription = {
            id: session.customer,
            status: 'active',
            expiryDate: expiryDate
        };

        await user.save();
    }
}

// res.json({ received: true });

    res.status(200).end();
  }
);

export default router ; 
