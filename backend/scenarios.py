"""
Agricultural Supply Chain Datasets & Scenarios
Contains realistic node definitions, produce types with perishability curves,
cold-chain vehicle specifications, and predefined regional networks.
"""

from typing import Dict, List, Any

PRODUCE_TYPES = {
    "tomatoes": {
        "name": "Organic Tomatoes",
        "category": "High Perishability",
        "shelf_life_hours": 72,
        "optimal_temp_c": 12,
        "spoilage_rate_per_hour": 0.015,
        "value_per_ton": 1800, # USD
        "icon": "🍅"
    },
    "berries": {
        "name": "Fresh Strawberries & Berries",
        "category": "Ultra Perishability",
        "shelf_life_hours": 36,
        "optimal_temp_c": 2,
        "spoilage_rate_per_hour": 0.038,
        "value_per_ton": 4500,
        "icon": "🍓"
    },
    "leafy_greens": {
        "name": "Hydroponic Lettuce & Spinach",
        "category": "High Perishability",
        "shelf_life_hours": 48,
        "optimal_temp_c": 4,
        "spoilage_rate_per_hour": 0.025,
        "value_per_ton": 2200,
        "icon": "🥬"
    },
    "dairy": {
        "name": "Raw & Processed Milk",
        "category": "Cold-Chain Critical",
        "shelf_life_hours": 60,
        "optimal_temp_c": 3,
        "spoilage_rate_per_hour": 0.020,
        "value_per_ton": 1200,
        "icon": "🥛"
    },
    "avocados": {
        "name": "Hass Avocados",
        "category": "Medium Perishability",
        "shelf_life_hours": 120,
        "optimal_temp_c": 8,
        "spoilage_rate_per_hour": 0.008,
        "value_per_ton": 3200,
        "icon": "🥑"
    }
}

VEHICLE_TYPES = {
    "reefer_electric": {
        "name": "Refrigerated EV Van",
        "capacity_tons": 5.0,
        "speed_kmh": 65,
        "cost_per_km": 0.85,
        "co2_per_km_kg": 0.05,
        "cooling_loss_factor": 0.8 # 20% better insulation
    },
    "reefer_truck_med": {
        "name": "Medium Reefer Truck (Diesel)",
        "capacity_tons": 12.0,
        "speed_kmh": 75,
        "cost_per_km": 1.40,
        "co2_per_km_kg": 0.65,
        "cooling_loss_factor": 1.0
    },
    "reefer_heavy": {
        "name": "Heavy Cold-Chain Hauler",
        "capacity_tons": 24.0,
        "speed_kmh": 70,
        "cost_per_km": 2.10,
        "co2_per_km_kg": 1.10,
        "cooling_loss_factor": 1.1
    }
}

DATASETS = {
    "california_central_valley": {
        "id": "california_central_valley",
        "title": "California Central Valley Agri-Corridor",
        "description": "High-value berry, tomato, and avocado transport from Fresno & Salinas Valley to San Francisco, San Jose, and Sacramento regional hubs.",
        "region": "California, USA",
        "nodes": [
            # Farms
            {"id": "F1", "name": "Salinas Berry Farm", "type": "farm", "lat": 36.6777, "lng": -121.6555, "supply_tons": 8.5, "produce": "berries", "temp_c": 18},
            {"id": "F2", "name": "Fresno Tomato Ranch", "type": "farm", "lat": 36.7468, "lng": -119.7726, "supply_tons": 15.0, "produce": "tomatoes", "temp_c": 24},
            {"id": "F3", "name": "Watsonville Organic Greens", "type": "farm", "lat": 36.9102, "lng": -121.7569, "supply_tons": 6.0, "produce": "leafy_greens", "temp_c": 20},
            {"id": "F4", "name": "Ventura Avocado Orchard", "type": "farm", "lat": 34.2746, "lng": -119.2290, "supply_tons": 18.0, "produce": "avocados", "temp_c": 22},
            
            # Cold Storage / Consolidation Hubs
            {"id": "H1", "name": "Gilroy Cold-Storage Hub", "type": "hub", "lat": 37.0058, "lng": -121.5683, "capacity_tons": 25.0, "precooling_rate_h": 2.0},
            {"id": "H2", "name": "Modesto Logistics Depot", "type": "hub", "lat": 37.6393, "lng": -120.9970, "capacity_tons": 30.0, "precooling_rate_h": 1.5},
            
            # Urban Retail Markets
            {"id": "M1", "name": "San Francisco Wholesale Produce Market", "type": "market", "lat": 37.7749, "lng": -122.4194, "demand_tons": 14.0, "max_sla_hours": 12},
            {"id": "M2", "name": "San Jose Distribution Center", "type": "market", "lat": 37.3382, "lng": -121.8863, "demand_tons": 18.0, "max_sla_hours": 10},
            {"id": "M3", "name": "Sacramento Metro Supermarket Hub", "type": "market", "lat": 38.5816, "lng": -121.4944, "demand_tons": 12.0, "max_sla_hours": 14}
        ]
    },
    "midwest_dairy_belt": {
        "id": "midwest_dairy_belt",
        "title": "Midwest Cold-Chain Dairy & Produce Belt",
        "description": "Multi-echelon fresh dairy and organic produce logistics network connecting Wisconsin farms through Illinois processing hubs to Chicago and Milwaukee retail centers.",
        "region": "Midwest, USA",
        "nodes": [
            {"id": "F1", "name": "Green Bay Dairy Farm", "type": "farm", "lat": 44.5133, "lng": -88.0133, "supply_tons": 20.0, "produce": "dairy", "temp_c": 15},
            {"id": "F2", "name": "Madison Organic Greens", "type": "farm", "lat": 43.0731, "lng": -89.4012, "supply_tons": 10.0, "produce": "leafy_greens", "temp_c": 18},
            {"id": "F3", "name": "Kenosha Berry Orchards", "type": "farm", "lat": 42.5847, "lng": -87.8212, "supply_tons": 7.0, "produce": "berries", "temp_c": 19},
            
            {"id": "H1", "name": "Milwaukee Cold Depot", "type": "hub", "lat": 43.0389, "lng": -87.9065, "capacity_tons": 22.0, "precooling_rate_h": 1.2},
            {"id": "H2", "name": "Rockford Processing Hub", "type": "hub", "lat": 42.2711, "lng": -89.0940, "capacity_tons": 20.0, "precooling_rate_h": 1.5},
            
            {"id": "M1", "name": "Chicago Central Retail Market", "type": "market", "lat": 41.8781, "lng": -87.6298, "demand_tons": 22.0, "max_sla_hours": 8},
            {"id": "M2", "name": "Naperville Suburban DC", "type": "market", "lat": 41.7508, "lng": -88.1535, "demand_tons": 12.0, "max_sla_hours": 12}
        ]
    },
    "indo_gangetic_perishable": {
        "id": "indo_gangetic_perishable",
        "title": "Indo-Gangetic Fresh Agri Logistics",
        "description": "Perishable tomato & leafy green cold-chain routing optimization across South-Asian agricultural hubs to urban consumption centers.",
        "region": "Northern / Southern India",
        "nodes": [
            {"id": "F1", "name": "Kolar Tomato Belt", "type": "farm", "lat": 13.1367, "lng": 78.1292, "supply_tons": 25.0, "produce": "tomatoes", "temp_c": 28},
            {"id": "F2", "name": "Ooty Hydroponic Farms", "type": "farm", "lat": 11.4102, "lng": 76.6950, "supply_tons": 8.0, "produce": "berries", "temp_c": 16},
            {"id": "F3", "name": "Hoskote Agri Produce", "type": "farm", "lat": 13.0710, "lng": 77.7983, "supply_tons": 12.0, "produce": "leafy_greens", "temp_c": 26},
            
            {"id": "H1", "name": "Bengaluru Mega Cold Hub", "type": "hub", "lat": 12.9716, "lng": 77.5946, "capacity_tons": 35.0, "precooling_rate_h": 1.0},
            
            {"id": "M1", "name": "Chennai Urban Retail Chain", "type": "market", "lat": 13.0827, "lng": 80.2707, "demand_tons": 22.0, "max_sla_hours": 10},
            {"id": "M2", "name": "Hyderabad Wholesale Market", "type": "market", "lat": 17.3850, "lng": 78.4867, "demand_tons": 20.0, "max_sla_hours": 14}
        ]
    }
}
