'use server';

import { sql } from '@vercel/postgres';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export type State = {
    errors?: {
        customerID?: string[];
        amount?: string[];
        status?: string[];
    };

    message?: string | null;
} 

const FormShema = z.object({
    id: z.string(),
    customerID: z.string({
        invalid_type_error: 'Please select a customer.'
    }),
    amount: z.coerce.
    number({})
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
    status: z.enum(['pending', 'paid'], {
        invalid_type_error: 'Please select an invoice status'
    }),
    date: z.string()
});

const CreateInvoice = FormShema.omit({ id: true, date: true });
const UpdateInvoice = FormShema.omit({ id: true, date: true });

const createInvoice = async (prevState: State, formData: FormData) => {
    const validateFields = CreateInvoice.safeParse({
        customerID : formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status') 
    });

    if(!validateFields.success) {
        return { errors: validateFields.error.flatten().fieldErrors, message: 'Missing Fields. Failed to Create Invoice' }
    }

    const { customerID, amount, status } = validateFields.data;
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

const updateInvoice = async (id: string, prevState: State, formData: FormData) => {
    const validateFields = UpdateInvoice.safeParse({
        customerID : formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status') 
    });

    if(!validateFields.success) {
        return { errors: validateFields.error.flatten().fieldErrors, message: 'Mising Fields. Failed to Update Invoice' }
    }

    const { customerID, amount, status } = validateFields.data;
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