import mongoose from 'mongoose';
import {Ad, Advertizer} from '../models/Advertizer/index_advertizer.js'
import sendEmail from '../utils/emailTransportation.js';
import Stripe from 'stripe';



export function handlePaymentIntentSucceeded(paymentIntent){
    console.log('check the structure ofthe paymentIntent:', paymentIntent)
}



export function  handlePaymentIntentFailed(paymentIntentFailed){
    console.log('check the structure ofthe paymentIntent:', paymentIntentFailed)
}



