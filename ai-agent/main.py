from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import os
import json
import asyncio
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import LangChain components
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain_community.llms import Ollama
from langchain.schema import BaseMessage, HumanMessage

# Tavily for web search (optional)
try:
    from tavily import TavilyClient
    tavily_available = True
except ImportError:
    tavily_available = False
    print("Tavily not available - web search features will be limited")

app = FastAPI(title="Airbnb AI Concierge Agent", version="1.0.1")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class BookingContext(BaseModel):
    location: str
    start_date: str
    end_date: str
    party_type: str

class Preferences(BaseModel):
    budget: str
    interests: List[str]
    mobility_needs: Optional[str] = None
    dietary_filters: List[str] = []

class AgentRequest(BaseModel):
    booking_context: BookingContext
    preferences: Preferences

class ActivityCard(BaseModel):
    title: str
    address: str
    price_tier: str
    duration: str
    tags: List[str]
    wheelchair_friendly: bool = False
    child_friendly: bool = False

class RestaurantRec(BaseModel):
    name: str
    cuisine: str
    address: str
    price_tier: str
    dietary_options: List[str]

class DayPlan(BaseModel):
    day: str
    morning: str
    afternoon: str
    evening: str

class AgentResponse(BaseModel):
    day_by_day_plan: List[DayPlan]
    activity_cards: List[ActivityCard]
    restaurant_recommendations: List[RestaurantRec]
    packing_checklist: List[str]

# Initialize Ollama LLM
ollama_base_url = os.getenv("OLLAMA_HOST", "http://localhost:11434")
try:
    llm = Ollama(model="mistral", base_url=ollama_base_url)
    ollama_available = True
except Exception as e:
    print(f"Ollama not available: {e}")
    llm = None
    ollama_available = False

# Initialize Tavily client if available
tavily_client = None
if tavily_available and os.getenv("TAVILY_API_KEY"):
    try:
        tavily_client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))
        print("Tavily client initialized successfully")
    except Exception as e:
        print(f"Failed to initialize Tavily client: {e}")
        tavily_client = None

@app.get("/")
async def root():
    return {"message": "Airbnb AI Concierge Agent is running!"}

@app.post("/generate-plan", response_model=AgentResponse)
async def generate_travel_plan(request: AgentRequest):
    """
    Generate a personalized travel plan based on booking context and preferences
    """
    try:
        # If Ollama is not available, use mock response
        if not ollama_available or not llm:
            return generate_mock_travel_plan(request)
        
        # Get local information if Tavily is available
        local_info = ""
        if tavily_client:
            local_info = await search_local_information(
                request.booking_context.location,
                "attractions and activities"
            )

        # Create enhanced prompt with local information
        prompt = create_travel_plan_prompt(request, local_info)

        # Generate response using Ollama
        response = await asyncio.get_event_loop().run_in_executor(
            None, lambda: llm.predict(prompt)
        )

        # Parse the AI response (in a real implementation, you'd want more sophisticated parsing)
        parsed_response = parse_ai_response(response, request)

        return parsed_response

    except Exception as e:
        # If AI generation fails, provide mock response as fallback
        print(f"AI generation error: {e}, falling back to mock response")
        return generate_mock_travel_plan(request)

async def search_local_information(location: str, query_type: str = "general") -> str:
    """Search for local information using Tavily API"""
    if not tavily_client:
        return "Local search not available - using general knowledge only"

    try:
        search_query = f"{location} {query_type} information for travelers"
        response = tavily_client.search(query=search_query, search_depth="advanced")

        if response and "results" in response:
            # Extract relevant information from search results
            results_text = ""
            for result in response["results"][:3]:  # Top 3 results
                if "content" in result:
                    results_text += f"\n{result['title']}: {result['content'][:200]}..."

            return results_text if results_text else "No specific local information found"
        else:
            return "No search results available"
    except Exception as e:
        print(f"Tavily search error: {e}")
        return "Search service temporarily unavailable"

def create_travel_plan_prompt(request: AgentRequest, local_info: str = "") -> str:
    """Create a detailed prompt for the AI agent"""
    local_context = f"\n\nLOCAL INFORMATION:\n{local_info}" if local_info else ""
    return f"""
    You are an expert travel concierge for Airbnb. Create a personalized travel plan for a guest.

    BOOKING DETAILS:
    - Location: {request.booking_context.location}
    - Check-in: {request.booking_context.start_date}
    - Check-out: {request.booking_context.end_date}
    - Travel Party: {request.booking_context.party_type}

    GUEST PREFERENCES:
    - Budget Level: {request.preferences.budget}
    - Interests: {', '.join(request.preferences.interests)}
    - Mobility Needs: {request.preferences.mobility_needs or 'None specified'}
    - Dietary Restrictions: {', '.join(request.preferences.dietary_filters) if request.preferences.dietary_filters else 'None'}{local_context}

    Please provide a detailed response in the following JSON format:
    {{
        "day_by_day_plan": [
            {{
                "day": "Day 1",
                "morning": "Morning activity description",
                "afternoon": "Afternoon activity description",
                "evening": "Evening activity description"
            }}
        ],
        "activity_cards": [
            {{
                "title": "Activity Name",
                "address": "Activity Address",
                "price_tier": "Budget/Mid-range/Luxury",
                "duration": "2-3 hours",
                "tags": ["tag1", "tag2"],
                "wheelchair_friendly": true/false,
                "child_friendly": true/false
            }}
        ],
        "restaurant_recommendations": [
            {{
                "name": "Restaurant Name",
                "cuisine": "Cuisine Type",
                "address": "Restaurant Address",
                "price_tier": "Budget/Mid-range/Luxury",
                "dietary_options": ["vegetarian", "vegan", "gluten-free"]
            }}
        ],
        "packing_checklist": [
            "Item 1 based on weather and activities",
            "Item 2 based on weather and activities"
        ]
    }}

    Consider the location's typical weather, local attractions, and cultural aspects.
    Ensure all recommendations align with the guest's budget, interests, mobility needs, and dietary restrictions.
    Provide practical, specific recommendations with addresses where possible.
    """

def generate_mock_travel_plan(request: AgentRequest) -> AgentResponse:
    """Generate a mock travel plan when AI is not available"""
    from datetime import datetime, timedelta
    
    # Calculate number of days
    start_date = datetime.strptime(request.booking_context.start_date, "%Y-%m-%d")
    end_date = datetime.strptime(request.booking_context.end_date, "%Y-%m-%d")
    num_days = (end_date - start_date).days
    
    # Generate day plans
    day_plans = []
    for i in range(min(num_days, 5)):  # Max 5 days
        day_plans.append(DayPlan(
            day=f"Day {i+1}",
            morning=f"Start your day with breakfast and explore the local neighborhood around {request.booking_context.location}. Visit local cafés and shops to get a feel for the area.",
            afternoon=f"Discover popular attractions and hidden gems in {request.booking_context.location}. Perfect for {request.booking_context.party_type} travelers with {request.preferences.budget} budget.",
            evening=f"Enjoy dinner at a local restaurant featuring {', '.join(request.preferences.interests[:2]) if request.preferences.interests else 'local'} cuisine. End the day with a leisurely walk or local entertainment."
        ))
    
    # Generate activity cards based on interests
    activities = []
    activity_templates = [
        ("Cultural Museum Tour", "Museum District", "2-3 hours", ["culture", "history", "indoor"]),
        ("Food Market Experience", "Local Market Square", "1-2 hours", ["food", "shopping", "local"]),
        ("Historical Walking Tour", "Old Town Center", "3-4 hours", ["history", "walking", "sightseeing"]),
        ("Art Gallery Visit", "Arts Quarter", "2 hours", ["art", "culture", "indoor"]),
        ("Scenic Viewpoint", "City Overlook", "1 hour", ["nature", "photography", "scenic"])
    ]
    
    for title, location, duration, tags in activity_templates[:3]:
        activities.append(ActivityCard(
            title=f"{title} in {request.booking_context.location}",
            address=f"{location}, {request.booking_context.location}",
            price_tier=request.preferences.budget,
            duration=duration,
            tags=tags,
            wheelchair_friendly=not request.preferences.mobility_needs or "wheelchair" not in request.preferences.mobility_needs.lower(),
            child_friendly=request.booking_context.party_type.lower() in ["family", "couple"]
        ))
    
    # Generate restaurant recommendations
    restaurants = []
    cuisine_types = ["Italian", "Local", "Mediterranean", "Asian Fusion", "French"]
    for i, cuisine in enumerate(cuisine_types[:3]):
        restaurants.append(RestaurantRec(
            name=f"{cuisine} Bistro",
            cuisine=cuisine,
            address=f"Restaurant District, {request.booking_context.location}",
            price_tier=request.preferences.budget,
            dietary_options=request.preferences.dietary_filters if request.preferences.dietary_filters else ["vegetarian", "vegan"]
        ))
    
    # Generate packing checklist
    packing_list = [
        "Comfortable walking shoes",
        "Weather-appropriate clothing",
        "Camera or smartphone for photos",
        "Portable charger",
        "Travel adapter (if international)",
        "Day backpack",
        "Water bottle",
        "Sunscreen and sunglasses",
        "Local currency or cards",
        "Maps or guidebook"
    ]
    
    if request.preferences.mobility_needs:
        packing_list.append("Mobility assistance devices")
    if "beach" in request.preferences.interests:
        packing_list.append("Swimwear and beach towel")
    if "hiking" in request.preferences.interests:
        packing_list.append("Hiking boots and equipment")
    
    return AgentResponse(
        day_by_day_plan=day_plans,
        activity_cards=activities,
        restaurant_recommendations=restaurants,
        packing_checklist=packing_list[:10]
    )

def parse_ai_response(response: str, request: AgentRequest) -> AgentResponse:
    """Parse the AI response into structured format"""
    try:
        # In a production system, you'd use proper JSON parsing and validation
        # For now, return a mock response structure
        return AgentResponse(
            day_by_day_plan=[
                DayPlan(
                    day="Day 1",
                    morning="Morning exploration of local area",
                    afternoon="Visit popular attractions",
                    evening="Dinner at recommended restaurant"
                )
            ],
            activity_cards=[
                ActivityCard(
                    title="City Tour",
                    address=f"{request.booking_context.location} City Center",
                    price_tier=request.preferences.budget,
                    duration="3-4 hours",
                    tags=request.preferences.interests,
                    wheelchair_friendly=request.preferences.mobility_needs != "wheelchair_accessible" if request.preferences.mobility_needs else True,
                    child_friendly="family" in request.booking_context.party_type.lower()
                )
            ],
            restaurant_recommendations=[
                RestaurantRec(
                    name="Local Restaurant",
                    cuisine="Local Cuisine",
                    address=f"{request.booking_context.location} Downtown",
                    price_tier=request.preferences.budget,
                    dietary_options=request.preferences.dietary_filters
                )
            ],
            packing_checklist=[
                "Comfortable walking shoes",
                "Weather-appropriate clothing",
                "Camera for sightseeing"
            ]
        )
    except Exception as e:
        # Fallback response in case of parsing errors
        return AgentResponse(
            day_by_day_plan=[],
            activity_cards=[],
            restaurant_recommendations=[],
            packing_checklist=[]
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
