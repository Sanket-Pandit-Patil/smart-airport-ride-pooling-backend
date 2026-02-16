# DSA Approach and Complexity Analysis

## Problem

- **Input:** Set of pending bookings (pickup, dropoff, luggage); cab capacity (seats, luggage).
- **Constraints:** Each passenger’s route detour ≤ max factor (e.g. 30%); total seats and luggage per cab not exceeded.
- **Objective:** Minimize total travel deviation (sum of extra distance over direct) while grouping into shared rides.

## Approach: Greedy Insertion

We use a **greedy** strategy that is fast and works well in practice:

1. **Order:** Process pending bookings in **FIFO** (created_at).
2. **For each booking:** Try to add it to an **existing ride** (in order) if:
   - Capacity (seats + luggage) is not exceeded.
   - After adding, **every** passenger in that ride (including the new one) has detour ≤ max factor.
3. **If no ride accepts:** Open a **new ride** with that booking.

Detour for a passenger = (actual distance along shared route from their pickup to their dropoff) vs (direct distance). Constraint: `(actual - direct) / direct ≤ MAX_DETOUR_FACTOR`.

Route for a ride = sequence of waypoints (pickups and dropoffs). We build it by:
- Collecting all pickup and dropoff points;
- Sorting: all pickups first (e.g. by latitude), then all dropoffs (e.g. by latitude), with tie-break by booking order.
This gives a simple, deterministic route that often keeps total deviation low when origins/destinations are clustered (e.g. airport → city).

## Data Structures and Operations

- **Bookings:** Array of records (id, pickup, dropoff, luggage).
- **Waypoints:** Array of { lat, lng, bookingId, type: PICKUP|DROPOFF, sequence }.
- **Distance:** Haversine for point-to-point; route distance = sum of segment lengths between consecutive waypoints.
- **Passenger route distance:** Sum of segment lengths from that passenger’s pickup waypoint to their dropoff waypoint along the ordered waypoints.

## Complexity (per matching run)

- **P** = number of pending bookings  
- **R** = number of rides (current + newly created); in worst case R = O(P).  
- **W** = max waypoints per ride; W = O(bookings in that ride) ≤ seat capacity (e.g. 4–6).

| Step | Complexity | Notes |
|------|------------|--------|
| Fetch pending | O(P) | Index on status, order by created_at |
| For each booking: try each ride | O(P × R) | Outer loop P, inner R |
| Detour check (build waypoints + check each passenger) | O(W) per ride | Waypoint build O(B log B), B = bookings in ride; B, W small |
| **Overall** | **O(P × R × W)** | In worst case R = O(P), so O(P² × W); W is small constant |

So **time** is **O(P²)** in the worst case when every booking gets its own ride then we still try each new booking against all existing rides. In practice many bookings merge into few rides, so R ≪ P and behaviour is closer to **O(P × R)**.

**Space:** O(P) for pending list + O(R × W) for ride groups and waypoints ⇒ **O(P + R × W)**.

## Why Greedy

- **Optimal** grouping (e.g. set partition + TSP per group) is NP-hard; greedy gives a **good tradeoff** between solution quality and **latency** (target &lt;300ms).
- **FIFO** is fair and predictable; **detour check** guarantees no passenger exceeds tolerance.
- **Indexing** (status, created_at) keeps the “get pending” step fast so the main cost is in-memory grouping.

## Alternative / Future

- **Clustering:** Pre-cluster by pickup/dropoff (e.g. grid or distance threshold), then run greedy within each cluster to reduce P and R in each batch.
- **Route optimization:** Replace “sort pickups/dropoffs” with a small TSP or insertion heuristic for waypoints to reduce total deviation further (still O(small) per ride).
