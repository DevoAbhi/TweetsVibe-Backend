import puppeteer from 'puppeteer';
import { client } from "@gradio/client";
import Search from '../models/Search.js';
import cron from 'node-cron';

export const postScrapper = async (req, res, next) => {

    // cron.schedule('*/5 * * * *', () => {
    //     scrapeTwitter(req, res);
    // }, { scheduled: true, timezone: 'UTC' });

    scrapeTwitter(req, res);
    let daysRemaining = 6;

    const cronJob = cron.schedule('0 8 * * *', () => {
        if(daysRemaining > 0) {
            scrapeTwitter(req, res);
            daysRemaining--;
        }
        else {
            cronJob.stop();
        }
    }, { scheduled: true, timezone: 'UTC' });

    return res.status(200).json({
        success: true
    })

};

const test = () => {
    console.log("Reached here");
}

const scrapeTwitter = async (req, res) => {
    try {

        const { searchWord } = req.body;
        const userId = req.userId;

        const browser = await puppeteer.launch({
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--single-process'
            ],
            headless: true,
            executablePath: process.env.NODE_ENV === "production" ? process.env.PUPPETEER_EXECUTABLE_PATH : puppeteer.executablePath()
        });
        const page = await browser.newPage();

        // Navigate to Twitter login page
        await page.goto('https://twitter.com/login');
        await page.waitForSelector('input[name="text"]');
        // await page.screenshot({ path: 'screenshot.png' });
        //
        // Login
        await page.type('input[name="text"]', 'AbhinabRoy9');
        await page.keyboard.press('Enter')
        // await page.screenshot({ path: 'screenshot.png' });
        await page.waitForSelector('input[name="password"]');

        await page.type('input[name="password"]', 'Abhinab@123');
        await page.click('div[data-testid="LoginForm_Login_Button"]');
        await page.waitForSelector('div[data-testid="tweetText"]');
        // await page.screenshot({ path: 'screenshot1.png' });



        await page.goto(`https://twitter.com/search?q=${encodeURIComponent(searchWord)}&src=typed_query&f=live`);

        // await page.click('a[href="/explore"]');
        // await page.screenshot({ path: 'screenshot_afterClickingSearchButton.png' });
        // await page.waitForSelector('input[aria-label="Search query"]');
        // await page.type('input[aria-label="Search query"]', 'pathaan');
        // await page.keyboard.press('Enter')


        await page.waitForSelector('div[data-testid="tweetText"]');
        // await page.screenshot({ path: 'screenshot.png' });

        let extractedTweets = [];
        while (extractedTweets.length < 10) {
            const tweets = await page.$$eval('div[data-testid="tweetText"]', (tweetElements) =>
                tweetElements.map((tweetElement) => tweetElement.innerText)
            );

            extractedTweets = [...extractedTweets, ...tweets];

            if (extractedTweets.length < 10) {
                await page.evaluate(() => {
                    window.scrollBy(0, window.innerHeight);
                });
                await page.waitForTimeout(1000); // Wait for new tweets to load
            }
        }


        await browser.close();

        const cleanedTweets = extractedTweets.map((tweet) => {
            return tweet.replace(/\n/g, '').replace(/\+/g, '');
        });


        console.log(cleanedTweets);
        // console.log(cleanedTweets.length);

        const delimiter = "$%#@!";

        let formattedString = "";
        for (let tweet of cleanedTweets) {
            formattedString += tweet + delimiter;
        }

        formattedString = formattedString.endsWith(delimiter) ? formattedString.slice(0, -delimiter.length) : formattedString;

        const app = await client("https://devoabhi-twitter-sentiment-analysis.hf.space/");
        const { data } = await app.predict("/predict", [
            formattedString,
        ]);


        const final_output = data[0].split(delimiter);
        console.log(final_output);


        await saveSearchedResults(userId, searchWord, final_output);



    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: err.message
        })
    }
}

const saveSearchedResults = async (userId, searchWord, final_output) => {
    const extracted_sentiment = {
        positive: 0,
        neutral: 0,
        negative: 0
    };

    for (let sentiment of final_output) {
        if (sentiment === "positive") {
            extracted_sentiment.positive++;
        }
        else if (sentiment === "neutral") {
            extracted_sentiment.neutral++;
        }
        else {
            extracted_sentiment.negative++;
        }
    }

    const search = await Search.findOne({ userId, searchWord });
    if (!search) {

        try {
            const newSearch = await Search.create({
                userId,
                searchWord,
                dailySentiments: [
                    {
                        date: new Date(),
                        sentiment: {
                            positive: extracted_sentiment.positive,
                            neutral: extracted_sentiment.neutral,
                            negative: extracted_sentiment.negative
                        }
                    }
                ]
            })
        }
        catch (err) {
            console.log(err.message);
        }

    }
    else {

        try {
            const newDailySentiment = {
                date: new Date(),
                sentiment: {
                    positive: extracted_sentiment.positive,
                    neutral: extracted_sentiment.neutral,
                    negative: extracted_sentiment.negative
                },
            };

            await Search.findOneAndUpdate(
                { userId, searchWord },
                { $push: { dailySentiments: newDailySentiment } }
            );
        } catch (error) {
            console.log(error.message);
        }

    }

}
