import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

export type ExpensesDocument = HydratedDocument<Expenses>;

@Schema({ timestamps: true })
export class Expenses extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Space' })
  spaceID: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userID: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Categoris' })
  categoryID: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  date: Date;

  @Prop({ default: '' })
  description: string;
}

export const ExpensesSchema = SchemaFactory.createForClass(Expenses);
