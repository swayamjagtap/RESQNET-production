# RESQNET

**Intelligent and Transparent Disaster Relief Resource Allocation**

RESQNET is a Minimum Viable Product built for **DJSCE ELEVATE 1.0 — Problem Statement EL-02**.

It explores one central question:

> In a disaster, how can limited ambulances, hospital resources and changing road conditions be coordinated while keeping every allocation decision visible and reviewable?

RESQNET combines capacity-aware ambulance dispatch, resource-aware hospital selection, real road-network routing, live road disruption handling, policy comparison and a tamper-evident decision record in one interactive web application.

---

## Live Application

**Production:**  
https://resqnet-production.vercel.app

**Public Demo:**  
https://resqnet-production.vercel.app/demo

**Road Graph Preview:**  
https://resqnet-production.vercel.app/graph-preview

**Demo Video:**  
_To be added after the final screen recording is uploaded._

---

## Problem

Disaster response is not a single routing problem.

During a mass-casualty incident:

- ambulances have limited carrying capacity;
- patients may require different medical resources;
- hospitals have different beds, blood, ICU and ventilator availability;
- earlier allocations change the resources available for later patients;
- roads may become partially restricted or completely blocked;
- decisions must be made quickly while remaining understandable afterwards.

A purely nearest-hospital approach can therefore overlook resource suitability or changing operational conditions.

RESQNET treats response coordination as a changing allocation problem involving:

**casualties + ambulances + hospital resources + road accessibility + decision history**

---

## What the MVP Demonstrates

### Scenario Management

Authenticated users can:

- create and manage disaster-response scenarios;
- define incident locations;
- configure synthetic casualty demand;
- add receiving hospitals;
- define hospital resource inventories;
- configure ambulance units and carrying capacities;
- save scenario data through Supabase.

### Capacity-Aware Dispatch

Ambulances have limited patient capacity.

When one trip cannot clear all waiting casualties, ambulances can return to the response cycle and complete repeated trips.

### Resource-Aware Hospital Selection

Hospital selection considers simulated patient requirements together with:

- ICU beds;
- blood units;
- ventilators;
- general beds;
- road reachability.

Resources are reserved and consumed as assignments are completed, so later decisions operate on the remaining simulated capacity.

### Real Road-Network Routing

RESQNET routes over an OpenStreetMap-derived road graph rather than straight-line distance.

The MVP uses:

- graph-based routing;
- A* pathfinding;
- road-segment distance;
- simulated travel time;
- partial road restrictions;
- complete road blocking.

A dedicated road-graph preview is available at `/graph-preview`.

### Live Road Disruption and Rerouting

Road conditions can change during a simulation.

When a relevant road becomes unavailable, affected ambulances can recalculate their route from their current simulated position.

### Decision Record

Simulation events are recorded so the user can inspect why the response unfolded as it did.

The interface exposes events such as:

- dispatch;
- arrival;
- hospital selection;
- delivery;
- resource consumption;
- route disruption;
- rerouting;
- simulation completion.

### Tamper-Evident Verification

Decision entries are linked through SHA-256 hashes.

The MVP supports:

- verification of the retained chain;
- identification of a broken entry;
- JSON export;
- uploaded-file verification;
- controlled tamper testing.

This is **tamper-evident**, not an immutable blockchain or independently witnessed ledger.

### Policy Comparison

The same synthetic scenario can be evaluated under:

- the RESQNET resource-aware policy; and
- a simpler nearest-hospital / arrival-order baseline.

The comparison exposes trade-offs such as:

- simulated delivery time;
- high-priority delivery time;
- completed trips;
- delivery to hospitals lacking required simulated stock.

The comparison is demonstrative and does not represent a clinical or real-world performance claim.

---

## Public Demo

The public demo does not require authentication.

Two synthetic scenarios are available:

### Balanced Scenario

A scenario in which simulated hospital resources are broadly sufficient.

It is intended to demonstrate the normal RESQNET workflow:

**dispatch → route → hospital selection → delivery → audit**

### Resource-Stress Scenario

A controlled synthetic scenario where the nearest hospital lacks critical simulated stock.

It is designed to expose the trade-off between:

- proximity; and
- resource suitability.

The scenario exists for demonstration and comparison only.

---

## System Architecture

```text
User / Public Demo
        │
        ▼
React + TypeScript Interface
        │
        ├── Scenario Configuration
        ├── Simulation Dashboard
        ├── Road Graph
        ├── Policy Comparison
        └── Decision Verification
        │
        ▼
Simulation Layer
        │
        ├── Capacity-aware dispatch
        ├── Resource-aware hospital selection
        ├── A* routing
        ├── Road disruption handling
        └── Event / decision generation
        │
        ▼
Supabase
        ├── Authentication
        ├── Scenarios
        ├── Hospitals
        └── Ambulances