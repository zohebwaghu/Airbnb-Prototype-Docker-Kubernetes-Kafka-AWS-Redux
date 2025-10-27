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
from langchain.schema import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain.memory import ConversationBufferMemory

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

# Chat Models
class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    user_message: str
    booking_context: Optional[Dict] = None
    conversation_history: Optional[List[ChatMessage]] = []

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

@app.post("/chat")
async def chat_with_agent(request: ChatRequest):
    """
    Chat with the AI agent using natural language
    Supports free-text queries with NLU understanding
    """
    try:
        user_message = request.user_message
        booking_context = request.booking_context or {}
        conversation_history = request.conversation_history or []
        
        # Extract context from user message or provided context
        location = booking_context.get("location", "a location")
        
        # Search for local information using Tavily
        local_info = ""
        if tavily_client and location != "a location":
            try:
                local_info = await search_local_information(
                    location,
                    "attractions restaurants events weather"
                )
            except Exception as e:
                print(f"Tavily search error: {e}")
        
        # Build context-aware response
        response = await generate_chat_response(
            user_message, 
            booking_context, 
            local_info,
            conversation_history
        )
        
        # Check if the user is asking for a travel plan
        should_generate_plan = any(keyword in user_message.lower() for keyword in [
            "plan", "itinerary", "schedule", "what to do", "activities", 
            "recommendations", "suggestions"
        ])
        
        result = {
            "assistant_message": response,
            "travel_plan": None
        }
        
        if should_generate_plan and booking_context and location != "a location":
            try:
                # Convert Dict to proper types for AgentRequest
                agent_req = AgentRequest(
                    booking_context=BookingContext(
                        location=booking_context.get("location", ""),
                        start_date=booking_context.get("start_date", ""),
                        end_date=booking_context.get("end_date", ""),
                        party_type=booking_context.get("party_type", "")
                    ),
                    preferences=Preferences(
                        budget=booking_context.get("budget", "moderate"),
                        interests=booking_context.get("interests", []),
                        mobility_needs=booking_context.get("mobility_needs"),
                        dietary_filters=booking_context.get("dietary_filters", [])
                    )
                )
                travel_plan = await generate_enhanced_mock_travel_plan(agent_req)
                result["travel_plan"] = travel_plan
            except Exception as e:
                print(f"Error generating travel plan: {e}")
        
        return result
        
    except Exception as e:
        print(f"Chat error: {e}")
        return {
            "assistant_message": f"I apologize, but I encountered an error: {str(e)}. How can I help you with your travel plans?",
            "travel_plan": None
        }

@app.post("/generate-plan", response_model=AgentResponse)
async def generate_travel_plan(request: AgentRequest):
    """
    Generate a personalized travel plan based on booking context and preferences
    """
    try:
        # Skip Ollama for now due to performance issues - use fast mock response
        # TODO: Integrate a faster LLM API in the future (OpenAI, Anthropic, etc.)
        use_ai = False  # Set to True to enable Ollama (slow but AI-generated)
        
        if not use_ai or not ollama_available or not llm:
            # Use enhanced mock response for fast performance
            return await generate_enhanced_mock_travel_plan(request)
        
        # Get local information if Tavily is available
        local_info = ""
        if tavily_client:
            local_info = await search_local_information(
                request.booking_context.location,
                "attractions and activities"
            )

        # Create enhanced prompt with local information
        prompt = create_travel_plan_prompt(request, local_info)

        # Generate response using Ollama (use invoke instead of deprecated predict)
        # Set a shorter timeout to avoid hanging
        try:
            response = await asyncio.wait_for(
                asyncio.get_event_loop().run_in_executor(
                    None, lambda: llm.invoke(prompt)
                ),
                timeout=30.0  # 30 second timeout
            )

            # Parse the AI response
            parsed_response = parse_ai_response(response, request)
            return parsed_response
        except asyncio.TimeoutError:
            print("Ollama timeout - falling back to mock response")
            return await generate_enhanced_mock_travel_plan(request)

    except Exception as e:
        # If AI generation fails, provide mock response as fallback
        print(f"AI generation error: {e}, falling back to mock response")
        return await generate_enhanced_mock_travel_plan(request)

async def generate_chat_response(
    user_message: str,
    booking_context: Dict,
    local_info: str,
    conversation_history: List[ChatMessage]
) -> str:
    """
    Generate a context-aware chat response using NLU
    Understands user intent and provides helpful travel assistance
    """
    message_lower = user_message.lower()
    
    # Extract booking info for context
    location = booking_context.get("location", "")
    check_in = booking_context.get("start_date", "")
    check_out = booking_context.get("end_date", "")
    party_type = booking_context.get("party_type", "")
    
    # NLU Intent Detection
    greetings = ["hello", "hi", "hey", "greetings", "good morning", "good afternoon", "good evening"]
    plan_requests = ["plan", "itinerary", "schedule", "activities", "what to do", "recommendations"]
    restaurant_queries = ["restaurant", "food", "eat", "dining", "cafe", "cuisine", "where to eat"]
    weather_queries = ["weather", "climate", "temperature", "rain", "sunny", "warm", "cold"]
    packing_queries = ["pack", "bring", "packing list", "luggage", "what to pack"]
    event_queries = ["event", "festival", "concert", "show", "happening"]
    
    # Generate contextual response
    response_parts = []
    
    # Detect greeting
    if any(greeting in message_lower for greeting in greetings):
        response_parts.append(f"Hello! I'm your AI travel concierge.")
        if location:
            response_parts.append(f"I see you're planning a trip to {location}.")
    
    # Detect plan request
    if any(keyword in message_lower for keyword in plan_requests):
        if location:
            response_parts.append(f"I can help you create a personalized itinerary for {location}!")
            if local_info:
                response_parts.append(f"I have some great information about attractions and activities there.")
            else:
                response_parts.append("Would you like me to search for current events and attractions?")
        else:
            response_parts.append("I'd be happy to help you plan your trip! Which location are you visiting?")
    
    # Detect restaurant queries
    elif any(keyword in message_lower for keyword in restaurant_queries):
        if local_info:
            response_parts.append(f"Here are some great dining options I found for {location}:")
            # Extract restaurant info from local_info if available
            if "restaurant" in local_info.lower():
                response_parts.append("I can recommend several restaurants that match your preferences.")
        else:
            response_parts.append(f"I can help you find restaurants in {location}. Let me search for options.")
    
    # Detect weather queries
    elif any(keyword in message_lower for keyword in weather_queries):
        if local_info and "weather" in local_info.lower():
            response_parts.append(f"Weather information for {location}:")
            response_parts.append(local_info.split("weather")[1][:200] if "weather" in local_info else "Check your packing list for weather-appropriate clothing.")
        else:
            response_parts.append(f"For accurate weather in {location}, check a weather app for current conditions.")
    
    # Detect packing queries
    elif any(keyword in message_lower for keyword in packing_queries):
        response_parts.append(f"Here's what I recommend packing for your trip to {location}:")
        if party_type:
            response_parts.append(f"Since you're traveling as a {party_type}, I'll tailor my suggestions accordingly.")
    
    # Detect event queries
    elif any(keyword in message_lower for keyword in event_queries):
        if local_info:
            if "event" in local_info.lower():
                response_parts.append(f"Here are some events happening during your visit to {location}:")
            else:
                response_parts.append(f"Let me search for current events in {location}.")
        else:
            response_parts.append(f"I can help you find events in {location}. Would you like me to search?")
    
    # Context-aware follow-up
    if check_in and check_out:
        response_parts.append(f"Your trip is from {check_in} to {check_out}.")
    
    if not response_parts:
        # Default helpful response
        response_parts.append(f"I'm here to help with your travel plans!")
        if location:
            response_parts.append(f"For {location}, I can help with:")
            response_parts.append("• Day-by-day itineraries")
            response_parts.append("• Restaurant recommendations")
            response_parts.append("• Activity suggestions")
            response_parts.append("• Packing checklists")
            response_parts.append("• Local events and attractions")
        else:
            response_parts.append("Tell me about your upcoming trip and I'll provide personalized recommendations!")
    
    # Add local context if available
    if local_info and len(local_info) > 0:
        summary = local_info[:300] if len(local_info) > 300 else local_info
        response_parts.append(f"\nLocal Information: {summary}...")
    
    return "\n".join(response_parts)

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

async def generate_enhanced_mock_travel_plan(request: AgentRequest) -> AgentResponse:
    """
    Generate an enhanced mock travel plan with detailed, personalized recommendations
    """
    # Get local information to make recommendations more accurate
    local_info = ""
    if tavily_client:
        try:
            local_info = await search_local_information(
                request.booking_context.location,
                "attractions restaurants activities"
            )
        except Exception as e:
            print(f"Tavily search failed: {e}")
    
    return generate_mock_travel_plan_detailed(request, local_info)

def generate_mock_travel_plan_detailed(request: AgentRequest, local_info: str) -> AgentResponse:
    """Generate a detailed mock travel plan with personalized recommendations"""
    from datetime import datetime
    
    # Calculate number of days
    start_date = datetime.strptime(request.booking_context.start_date, "%Y-%m-%d")
    end_date = datetime.strptime(request.booking_context.end_date, "%Y-%m-%d")
    num_days = max(1, (end_date - start_date).days)
    
    # Parse location
    location_name = request.booking_context.location.split(',')[0] if ',' in request.booking_context.location else request.booking_context.location
    
    # Generate detailed day plans
    day_plans = []
    for i in range(min(num_days, 5)):  # Max 5 days
        day_num = i + 1
        morning_activity = f"Start Day {day_num} with breakfast at a local café in {location_name}. Explore the neighborhood and soak in the local atmosphere."
        afternoon_activity = f"Discover {location_name}'s top attractions. Perfect for {request.booking_context.party_type} with {request.preferences.budget} budget."
        evening_activity = f"Enjoy dinner featuring {', '.join(request.preferences.interests[:2]) if request.preferences.interests else 'local'} cuisine, followed by an evening stroll."
        
        day_plans.append(DayPlan(
            day=f"Day {day_num}",
            morning=morning_activity,
            afternoon=afternoon_activity,
            evening=evening_activity
        ))
    
    # Generate activity cards based on interests
    activities = []
    base_interests = request.preferences.interests if request.preferences.interests else ["culture", "food", "sightseeing"]
    
    # Create diverse activity cards
    activity_templates = [
        ("Cultural Museum Tour", "Museum District", "2-3 hours", ["culture", "history", "indoor"]),
        ("Food Market Experience", "Local Market Square", "1-2 hours", ["food", "shopping", "local"]),
        ("Historical Walking Tour", "Old Town Center", "3-4 hours", ["history", "walking", "sightseeing"]),
        ("Art Gallery Visit", "Arts Quarter", "2 hours", ["art", "culture", "indoor"]),
        ("Scenic Viewpoint", "City Overlook", "1 hour", ["nature", "photography", "scenic"]),
        ("Local Food Tour", "Restaurant Quarter", "2-3 hours", ["food", "culture", "local"])
    ]
    
    # Select activities based on user interests
    selected_activities = []
    for template in activity_templates:
        if any(tag in base_interests for tag in template[3]):
            selected_activities.append(template)
    
    # If no matches, use first 3
    if not selected_activities:
        selected_activities = activity_templates[:3]
    
    for title, location, duration, tags in selected_activities[:3]:
        activities.append(ActivityCard(
            title=f"{title} in {location_name}",
            address=f"{location}, {location_name}",
            price_tier=request.preferences.budget,
            duration=duration,
            tags=tags,
            wheelchair_friendly=True if not request.preferences.mobility_needs else "wheelchair" not in request.preferences.mobility_needs.lower(),
            child_friendly="family" in request.booking_context.party_type.lower() or "kids" in request.booking_context.party_type.lower()
        ))
    
    # Generate restaurant recommendations
    restaurants = []
    cuisine_types = ["Italian", "Local", "Mediterranean", "Asian Fusion", "French", "Seafood", "Farm-to-Table"]
    
    for i, cuisine in enumerate(cuisine_types[:4]):
        dietary_opts = request.preferences.dietary_filters if request.preferences.dietary_filters else ["vegetarian", "vegan", "gluten-free"]
        restaurants.append(RestaurantRec(
            name=f"{cuisine} Bistro",
            cuisine=cuisine,
            address=f"Restaurant District, {location_name}",
            price_tier=request.preferences.budget,
            dietary_options=dietary_opts
        ))
    
    # Enhanced packing checklist
    packing_list = [
        "Comfortable walking shoes",
        f"Weather-appropriate clothing for {location_name}",
        "Camera or smartphone for photos",
        "Portable charger and cables",
        "Travel adapter (for international trips)",
        "Day backpack",
        "Reusable water bottle",
        "Sunscreen and sunglasses",
        "Local currency or international payment cards",
        "Travel guide or map app"
    ]
    
    # Add specific items based on preferences
    if request.preferences.mobility_needs:
        packing_list.insert(3, "Mobility assistance devices")
    
    if any("beach" in s.lower() for s in base_interests):
        packing_list.extend(["Swimwear", "Beach towel", "Sunscreen"])
    
    if any("hiking" in s.lower() or "nature" in s.lower() for s in base_interests):
        packing_list.extend(["Hiking boots", "Outdoor gear"])
    
    if any("shopping" in s.lower() for s in base_interests):
        packing_list.append("Extra suitcase space")
    
    return AgentResponse(
        day_by_day_plan=day_plans,
        activity_cards=activities[:3],
        restaurant_recommendations=restaurants[:4],
        packing_checklist=packing_list[:12]
    )

def generate_mock_travel_plan(request: AgentRequest) -> AgentResponse:
    """Generate a mock travel plan when AI is not available (legacy function)"""
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
