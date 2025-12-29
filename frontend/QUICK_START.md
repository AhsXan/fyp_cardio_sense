# Quick Start Guide

Get the Cardio-Sense frontend running in under 10 minutes!

## Step 1: Install Dependencies

```bash
cd frontend
npm install
```

## Step 2: Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Step 3: Test the Application

### Test Users

You can log in with these mock accounts:

**Doctor:**
- Email: `raja3.ahsan@gmail.com`
- Password: `password123`

**Researcher:**
- Email: `ahsan3.dev@gmail.com`
- Password: `password123`

**Patient:**
- Email: `ahsan3.aahmed@gmail.com`
- Password: `password123`

### Test Flow

1. **Landing Page**: Visit `http://localhost:3000`
2. **Sign Up**: Click "Sign up" → Select a role → Fill the form
3. **OTP Verification**: Enter any 6-digit number (e.g., `123456`)
4. **Login**: Use one of the test accounts above
5. **Upload**: Go to Upload page and select a WAV/MP3 file (sample file: `public/a0007.wav`)
6. **View Results**: After upload, view the analysis results

## Troubleshooting

### MSW Not Working?

If API calls aren't being mocked:
1. Check browser console for MSW initialization messages
2. Ensure you're in development mode (`npm run dev`)
3. MSW should automatically start - check for "Mocking enabled" in console

### Port Already in Use?

Change the port in `vite.config.js`:
```javascript
server: {
  port: 3001, // Change to any available port
}
```

### Tests Not Running?

Make sure all dependencies are installed:
```bash
npm install
```

Then run:
```bash
npm test
```

## Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Check [api_contract.md](./api_contract.md) to understand the API structure
- Review [STYLE_GUIDE.md](./STYLE_GUIDE.md) for design guidelines

## Need Help?

- Check the main README for detailed setup instructions
- Review the API contract to understand backend requirements
- All components are in `src/components/` for reference

