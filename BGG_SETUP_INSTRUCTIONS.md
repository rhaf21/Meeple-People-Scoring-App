# BoardGameGeek API Setup Instructions

## Why This Is Needed

As of 2025, BoardGameGeek (BGG) requires all applications using their XML API to register and use authentication tokens. This is required for:
- Searching for games via BGG
- Fetching game details (descriptions, ratings, player counts, etc.)
- The migration script to populate existing games with BGG data

## Step-by-Step Registration Process

### Step 1: Register Your Application

1. Go to https://boardgamegeek.com/applications
2. Log in to your BGG account (create one if you don't have it)
3. Click the **"Create an Application"** button
4. Fill out the application form:
   - **Application Name**: `Farty Meople Scoring App`
   - **Description**: `Personal board game scoring tracker for game nights with friends`
   - **License Type**: Select **Non-commercial** (This is FREE)
   - **Website** (optional): Your app URL or leave blank
   - **Callback URL** (optional): Leave blank for now

5. Submit the application
6. **Wait for approval** (may take 1 week or longer)

### Step 2: Generate API Token

Once your application is approved:

1. Go back to https://boardgamegeek.com/applications
2. Find your approved application
3. Click **"Tokens"**
4. Click **"Create Token"** or **"Generate Token"**
5. Copy the token value (it will look like a long string of characters)

### Step 3: Add Token to Your Environment

1. Open your `.env.local` file
2. Add this line (replace with your actual token):
   ```
   BGG_API_TOKEN=your-actual-token-here
   ```
3. Save the file
4. Restart your development server

## Testing the Integration

Once you've added the token:

### Test 1: Add a New Game
1. Go to the Games page
2. Click "Add Game"
3. Search for a game (e.g., "Wingspan")
4. If it works, you'll see search results!

### Test 2: Run the Migration Script
To populate your existing 13 games with BGG data:

```bash
# Dry run first (preview changes)
npm run migrate:bgg -- --dry-run

# Actually update the database
npm run migrate:bgg
```

## License Requirements

By using BGG's API with a non-commercial license, you agree to:

✅ **Already Implemented**:
- Display "Powered by BoardGameGeek" attribution (added to modals)
- Make requests server-side only (already done)

⚠️ **Your Responsibility**:
- Only use for non-commercial purposes
- Don't exceed reasonable rate limits (script already includes delays)
- No technical support is provided by BGG

## Troubleshooting

### "401 Unauthorized" Errors
- Make sure you've added `BGG_API_TOKEN` to `.env.local`
- Verify the token is correct (no extra spaces)
- Restart your dev server after adding the token

### Application Not Approved Yet
- Wait patiently (can take 1+ weeks)
- Check your BGG account notifications
- You can follow up in the BGG forums if it's been over 2 weeks

### Still Having Issues?
- Check BGG forums: https://boardgamegeek.com/forum/1229
- Review BGG API docs: https://boardgamegeek.com/using_the_xml_api
- Verify your `.env.local` file has the correct format

## What Happens After Setup

Once the token is working:

1. **Add Game Modal** - BGG search will work, fetching full game details
2. **Game Details Modal** - Will show descriptions, ratings, categories, mechanics
3. **Migration Script** - Can populate your 13 existing games with BGG data
4. **All new games** - Will automatically have BGG data when added

---

**Next Steps**: Start the registration process at https://boardgamegeek.com/applications
