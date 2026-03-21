# Supabase Setup Instructions

1. **Create an Account / Login**: Go to [Supabase](https://supabase.com) and sign in.
2. **Create a New Project**: Click on "New Project", select your organization, give it a name (e.g., "Capstone POS"), generate a strong database password, and choose a region closest to your users.
3. **Wait for Provisioning**: Takes a few minutes to provision the database.
4. **Execute the SQL Schema**:
   - On the left sidebar of your Supabase dashboard, click on **SQL Editor**.
   - Click "New Query" and paste the contents of `database/schema.sql` into the editor.
   - Click **Run** to create the tables and seed the initial admin account.
5. **Get Connection Credentials**:
   - Go to **Project Settings** (gear icon on the bottom left).
   - Navigate to the **Database** section.
   - Look for the **Connection string (URI)**.
   - Copy the string and replace `[YOUR-PASSWORD]` with the password you generated in step 2.
6. **Configure the Backend**:
   - Create a `.env` file in the `backend/` directory of this project.
   - Add the following variable with your connection string:
     ```env
     DATABASE_URL=postgres://postgres.[project-id]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
     PORT=5000
     JWT_SECRET=super_secret_pos_key_12345
     MOMO_API_KEY=your_momo_sandbox_key
     ```
7. **Start the Backend**:
   - Run `node server.js` or `npm run dev` in the `backend` folder.
