Simple Retro Gaming Platform - NextRivals
The website can be used locally or you could move all of your assets into an S3 bucket.

**Note that game ROMS are not included.*

## Getting Started

Setup your enviroment veraibles:
```
DATABASE_URL=file:./dev.db
NEXT_WEBSITE_URL=localhost:3000
AUTH_SECRET=YourSecretPhrase
NEXT_AWS_S3_BUCKET_NAME=Your_Bucket_Name_Here
NEXT_AWS_S3_REGION=Your_Bucket_Region_Here
NEXT_AWS_S3_KEY_ID=Your_Key_Id
NEXT_AWS_S3_SECRET_ACCESS_KEY=Your_Access_Key
NEXT_PUBLIC_IMAGE_SOURCE=Your_CDN_Here
```

```bash
npm install
npm run dev
```

Download the project and run:

```bash
npm install
npm run dev
```

In a development environment, use the migrate dev command to generate and apply migrations:

```bash
npx prisma migrate dev
```

To seed the demo data into the database apply:

```bash
npx prisma db seed
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.


## 3S Bucket Policy

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::game-website123/*"
        }
    ]
}
```