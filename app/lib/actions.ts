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
const UpdateInvoice = FormShema.omit({ id: true, date: true });

const createInvoice = async (formData: FormData) => {
    const { customerID, amount, status} = CreateInvoice.parse({
        customerID : formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status') 
    });

    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];
    
    try {
        await sql`
            INSERT INTO invoices(customer_id, amount, status, date)
            VALUES (${customerID}, ${amountInCents}, ${status}, ${date})
        `;
    } catch(error) {
        return { message: 'Database Error: Failed to Create Invoice' }
    }

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

const updateInvoice = async (id: string, formData: FormData) => {
    const { customerID, amount, status } = UpdateInvoice.parse({
        customerID: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status')
    });

    const amountInCents = amount * 100;

    try {

        await sql` 
            UPDATE invoices
            SET customer_id = ${customerID}, amount = ${amountInCents}, status = ${status}
            WHERE id = ${id}
        `;
    } catch(error) {
        return { message: 'Database Error: Failed to Update Invoice' }
    }

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

const deleteInvoice = async (id: string) => {
    try {
        await sql`
            DELETE FROM invoices
            WHERE id = ${id}
        `;
    } catch(error) {
        return { message: 'Database Error: Failed to Delete Invoice' }
    }

    revalidatePath('/dashboard/invoices');
}

export {
    createInvoice,
    updateInvoice,
    deleteInvoice
}