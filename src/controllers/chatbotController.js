const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const chatbotMessage = async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ success: false, message: "User message is required" });
    }

    const lowerMessage = message.toLowerCase();

    // Rule-based logic (more flexible with Regex)
    if (/submit|file/i.test(lowerMessage) && /complaint/i.test(lowerMessage)) {
        return res.json({
            reply: "To submit a complaint, follow these steps:\n\n1. Go to your **Dashboard**.\n2. Click on the **'File New Complaint'** button.\n3. Follow the 4-step process to select a category, provide details, set location, and upload photos."
        });
    }

    if (/track/i.test(lowerMessage) || /status/i.test(lowerMessage)) {
        return res.json({
            reply: "You can track your complaints easily:\n\n*   Visit the **'My Activities'** tab on your Dashboard.\n*   View the **current status** (Pending, In Progress, resolved).\n*   Click on a complaint to see a detailed **timeline** of updates."
        });
    }

    if (/category|categories/i.test(lowerMessage)) {
        return res.json({
            reply: "Our system handles various categories:\n\n*   💧 **Water Supply**\n*   ⚡ **Electricity**\n*   🛣️ **Roads & Infrastructure**\n*   🚮 **Waste Management**\n*   🏥 **Public Health**\n*   💡 **Street Lighting**"
        });
    }

    if (/dashboard|where/i.test(lowerMessage)) {
        return res.json({
            reply: "You are on the CIVITAS platform. Your dashboard provides a quick overview of your activities, city-wide stats, and a feed of recent complaints. Use the sidebar to navigate between Dashboard, Analytics, and Profile."
        });
    }

    // Gemini AI Fallback
    try {
        // Try multiple model variants available in this environment
        const modelNames = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-pro-latest"];
        let model;
        let success = false;
        let lastError;

        for (const modelName of modelNames) {
            try {
                model = genAI.getGenerativeModel({ model: modelName });
                const prompt = `You are CIVITAS AI Assistant for a Smart City Complaint Management System. 
                You help citizens with: submitting complaints, tracking complaints, identifying complaint categories, and using the dashboard.
                Be helpful, concise, and professional.
                
                User question: ${message}`;

                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();
                
                res.json({ reply: text });
                success = true;
                break;
            } catch (err) {
                lastError = err;
                console.error(`Failed with model ${modelName}:`, err.message);
                if (err.status === 400 && err.message.includes("API key not valid")) {
                    // Stop if key is invalid
                    break;
                }
            }
        }

        if (!success) {
            throw lastError;
        }

    } catch (error) {
        console.error("Gemini API Final Error:", error.message);
        
        let userMessage = "CIVITAS Assistant is temporarily unavailable.";
        if (error.message.includes("API key not valid")) {
            userMessage = "CIVITAS Assistant is unavailable due to an invalid API key. Please check your configuration.";
        } else if (error.status === 404) {
            userMessage = "CIVITAS Assistant could not find the AI model. Please check model availability in your region.";
        }

        res.status(error.status || 500).json({
            reply: userMessage,
            debug: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = { chatbotMessage };
