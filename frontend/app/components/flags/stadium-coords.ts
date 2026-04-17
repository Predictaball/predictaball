export type Stadium = {
    city: string
    name: string
    country: "usa" | "can" | "mex"
    lat: number
    lng: number
}

export const WORLD_CUP_2026_STADIUMS: Stadium[] = [
    {city: "Atlanta", name: "Mercedes-Benz Stadium", country: "usa", lat: 33.7554, lng: -84.4010},
    {city: "Boston", name: "Gillette Stadium", country: "usa", lat: 42.0909, lng: -71.2643},
    {city: "Dallas", name: "AT&T Stadium", country: "usa", lat: 32.7473, lng: -97.0945},
    {city: "Houston", name: "NRG Stadium", country: "usa", lat: 29.6847, lng: -95.4107},
    {city: "Kansas City", name: "Arrowhead Stadium", country: "usa", lat: 39.0489, lng: -94.4839},
    {city: "Los Angeles", name: "SoFi Stadium", country: "usa", lat: 33.9535, lng: -118.3392},
    {city: "Miami", name: "Hard Rock Stadium", country: "usa", lat: 25.9580, lng: -80.2389},
    {city: "New York New Jersey", name: "MetLife Stadium", country: "usa", lat: 40.8136, lng: -74.0744},
    {city: "Philadelphia", name: "Lincoln Financial Field", country: "usa", lat: 39.9008, lng: -75.1675},
    {city: "San Francisco Bay Area", name: "Levi's Stadium", country: "usa", lat: 37.4033, lng: -121.9694},
    {city: "Seattle", name: "Lumen Field", country: "usa", lat: 47.5952, lng: -122.3316},
    {city: "Toronto", name: "BMO Field", country: "can", lat: 43.6332, lng: -79.4185},
    {city: "Vancouver", name: "BC Place", country: "can", lat: 49.2768, lng: -123.1119},
    {city: "Guadalajara", name: "Estadio Akron", country: "mex", lat: 20.6819, lng: -103.4620},
    {city: "Mexico City", name: "Estadio Azteca", country: "mex", lat: 19.3029, lng: -99.1505},
    {city: "Monterrey", name: "Estadio BBVA", country: "mex", lat: 25.6692, lng: -100.2447},
]
