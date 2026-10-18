// Get HTML elements
const feedbackForm = document.getElementById("feedbackForm");
const message = document.getElementById("message");
const feedbackList = document.getElementById("feedbackList");

// Submit feedback to the server
feedbackForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const rating = document.getElementById("rating").value;
    const comment = document.getElementById("comment").value.trim();

    if (!name || !rating || !comment) {
        message.textContent = "Please fill in all fields.";
        message.style.color = "red";
        return;
    }

    message.textContent = "Submitting feedback...";
    message.style.color = "blue";

    try {
        const response = await fetch("/api/feedback", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: name,
                rating: Number(rating),
                comment: comment
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to submit feedback.");
        }

        message.textContent = "✅ Feedback submitted successfully!";
        message.style.color = "green";

        // Clear the form
        feedbackForm.reset();

        // Refresh the feedback list
        await loadFeedback();

    } catch (error) {
        console.error("Submission error:", error);
        message.textContent = "❌ " + error.message;
        message.style.color = "red";
    }
});


// Load feedback from MongoDB through the API
async function loadFeedback() {
    feedbackList.textContent = "Loading feedback...";

    try {
        const response = await fetch("/api/feedback");

        if (!response.ok) {
            throw new Error("Unable to retrieve feedback.");
        }

        const feedbacks = await response.json();

        // Clear existing feedback
        feedbackList.replaceChildren();

        if (!Array.isArray(feedbacks) || feedbacks.length === 0) {
            feedbackList.textContent = "No feedback submitted yet.";
            return;
        }

        // Display each feedback entry
        feedbacks.forEach(function (feedback) {
            const card = document.createElement("div");
            card.className = "feedback-item";

            const heading = document.createElement("h3");
            heading.textContent = feedback.name;

            const ratingElement = document.createElement("p");
            const rating = Number(feedback.rating);

            ratingElement.textContent =
                "Rating: " + "⭐".repeat(rating);

            const commentElement = document.createElement("p");
            commentElement.textContent = feedback.comment;

            const dateElement = document.createElement("small");

            if (feedback.createdAt) {
                dateElement.textContent =
                    "Submitted: " +
                    new Date(feedback.createdAt).toLocaleString();
            }

            card.appendChild(heading);
            card.appendChild(ratingElement);
            card.appendChild(commentElement);
            card.appendChild(dateElement);

            feedbackList.appendChild(card);
        });

    } catch (error) {
        console.error("Loading feedback error:", error);

        feedbackList.textContent =
            "Unable to load feedback. Please refresh the page.";
    }
}


// Load existing feedback when the page opens
loadFeedback();