-- NeonDB Schema for Doctor Prescription System
-- This schema stores customer information, orders, and prescriptions

-- Table: customers
-- Stores unique customer information
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: orders
-- Stores all orders received from n8n (Shopify + Salesforce data)
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  order_id VARCHAR(255) UNIQUE NOT NULL,
  order_number VARCHAR(255) NOT NULL,
  order_date TIMESTAMP NOT NULL,
  total_amount VARCHAR(50),
  currency VARCHAR(10),
  shipping_address TEXT,
  tags TEXT,
  
  -- Basic Patient Information
  sex VARCHAR(50),
  weight VARCHAR(50),
  height VARCHAR(50),
  over_18 VARCHAR(50),
  
  -- Weight & Diet
  weight_satisfaction TEXT,
  diet_description TEXT,
  
  -- Sexual Health
  sexual_issues_impact_relationship TEXT,
  
  -- Aging & Appearance
  worried_about_fast_aging TEXT,
  look_older_than_feel TEXT,
  decline_in_balance_function_mental TEXT,
  overtaken_by_aging TEXT,
  aging_process_impact TEXT,
  interest_in_slowing_aging TEXT,
  
  -- Muscle Health
  lack_of_muscle_mass_strength_impact TEXT,
  desired_muscle_mass_definition TEXT,
  desired_response_to_exercise TEXT,
  muscle_function_improvement_impact TEXT,
  steps_taken_for_muscle_health TEXT,
  effectiveness_of_actions_taken TEXT,
  
  -- Cognitive/Brain Function
  mentally_sharp_as_before TEXT,
  concern_about_cognitive_decline TEXT,
  taken_actions_to_improve_brain_function TEXT,
  nutritional_support_helps_for_brain TEXT,
  concerned_about_future_brain_function TEXT,
  
  -- Immune System
  more_unwell_than_before TEXT,
  less_effective_recovery_than_before TEXT,
  less_resilient_than_before TEXT,
  immune_health_helps_on_overall_wellness TEXT,
  immune_system_functioning_well TEXT,
  immune_measures_improve_health TEXT,
  
  -- Gut Health
  satisfied_with_gut_health TEXT,
  taken_actions_to_improve_gut_health TEXT,
  steps_taken_for_gut_health TEXT,
  gut_health_improve_overall_health TEXT,
  symptoms_might_related_to_gut_health TEXT,
  impact_of_better_gut_health TEXT,
  
  -- Mental Health
  mental_health_history TEXT,
  ever_received_counseling_or_treatment TEXT,
  current_mental_emotional_state_rating TEXT,
  
  -- Sleep & Energy
  difficulty_sleeping TEXT,
  feel_refreshed_eager_upon_waking TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: prescriptions
-- Stores prescription data filled out by doctors
CREATE TABLE IF NOT EXISTS prescriptions (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Doctor Information
  doctor_name VARCHAR(255) NOT NULL,

  -- Medicine Information
  medicine_name VARCHAR(255) NOT NULL,
  medicine_quantity VARCHAR(100),
  medicine_description TEXT,

  -- Pre-approved medicines for future prescriptions (stored as JSON array)
  pre_approved_medicines TEXT,

  -- Doctor's Notes
  doctor_notes TEXT,
  
  -- Health Assessment (from form)
  health_changes VARCHAR(10),
  health_changes_details TEXT,
  taking_medications VARCHAR(10),
  taking_medications_details TEXT,
  had_medication_before VARCHAR(10),
  pregnancy_status VARCHAR(50),
  allergic_reaction VARCHAR(10),
  allergies VARCHAR(10),
  allergies_details TEXT,
  medical_conditions VARCHAR(10),
  medical_conditions_details TEXT,
  
  -- Signature PDF path (if stored)
  signature_pdf_path TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for faster searches
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_customer_id ON prescriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_order_id ON prescriptions(order_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

