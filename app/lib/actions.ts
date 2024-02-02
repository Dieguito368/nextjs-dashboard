'use server';

import { sql } from '@vercel/postgres';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const FormShema = z.object({
    id: z.string(),
    customerID: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['pending', 'paid']),
    date: z.string()
});

const CreateInvoice = FormShema.omit({ id: true, date: true });

const createInvoice = async (formData: FormData) => {
    const { customerID, amount, status} = CreateInvoice.parse({
        customerID : formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status') 
    });

    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];

    await sql`
        INSERT INTO invoices(customer_id, amount, status, date)
        VALUES (${customerID}, ${amountInCents}, ${status}, ${date})
    `;

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
} 

export {
    createInvoice
}