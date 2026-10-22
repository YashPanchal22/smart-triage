-- Smart Healthcare Ecosystem — PostgreSQL schema (generated from SQLAlchemy models)
-- All demo data is synthetic.


CREATE TABLE ambulances (
	id SERIAL NOT NULL, 
	vehicle_no VARCHAR(20) NOT NULL, 
	status VARCHAR(20), 
	location VARCHAR(120), 
	crew VARCHAR(120), 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	PRIMARY KEY (id), 
	UNIQUE (vehicle_no)
)

;


CREATE TABLE beds (
	id SERIAL NOT NULL, 
	ward VARCHAR(80) NOT NULL, 
	bed_no VARCHAR(20) NOT NULL, 
	status VARCHAR(20), 
	PRIMARY KEY (id)
)

;


CREATE TABLE blood_donors (
	id SERIAL NOT NULL, 
	full_name VARCHAR(120) NOT NULL, 
	blood_group VARCHAR(5) NOT NULL, 
	phone VARCHAR(20), 
	gender VARCHAR(20), 
	age INTEGER, 
	last_donation DATE, 
	donations_count INTEGER, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	PRIMARY KEY (id)
)

;


CREATE TABLE blood_inventory (
	id SERIAL NOT NULL, 
	blood_group VARCHAR(5) NOT NULL, 
	units_available INTEGER, 
	units_reserved INTEGER, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	PRIMARY KEY (id)
)

;


CREATE TABLE blood_requests (
	id SERIAL NOT NULL, 
	hospital_unit VARCHAR(120), 
	blood_group VARCHAR(5) NOT NULL, 
	units INTEGER, 
	priority VARCHAR(20), 
	status VARCHAR(20), 
	requested_by INTEGER, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	PRIMARY KEY (id)
)

;


CREATE TABLE departments (
	id SERIAL NOT NULL, 
	name VARCHAR(80) NOT NULL, 
	description TEXT, 
	capacity INTEGER, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	PRIMARY KEY (id), 
	UNIQUE (name)
)

;


CREATE TABLE health_articles (
	id SERIAL NOT NULL, 
	slug VARCHAR(80) NOT NULL, 
	category VARCHAR(40), 
	lang VARCHAR(5), 
	title VARCHAR(200) NOT NULL, 
	body TEXT, 
	source VARCHAR(200), 
	PRIMARY KEY (id)
)

;


CREATE TABLE medicine_information (
	id SERIAL NOT NULL, 
	name VARCHAR(120) NOT NULL, 
	generic VARCHAR(120), 
	brands VARCHAR(200), 
	category VARCHAR(80), 
	uses TEXT, 
	safety TEXT, 
	warnings TEXT, 
	manufacturer VARCHAR(120), 
	source VARCHAR(200), 
	PRIMARY KEY (id)
)

;


CREATE TABLE ml_predictions (
	id SERIAL NOT NULL, 
	model VARCHAR(60), 
	input_json TEXT, 
	output VARCHAR(200), 
	created_by INTEGER, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	PRIMARY KEY (id)
)

;


CREATE TABLE nutrition_resources (
	id SERIAL NOT NULL, 
	title VARCHAR(200) NOT NULL, 
	lang VARCHAR(5), 
	"group" VARCHAR(20), 
	body TEXT, 
	source VARCHAR(200), 
	PRIMARY KEY (id)
)

;


CREATE TABLE service_directory (
	id SERIAL NOT NULL, 
	name VARCHAR(150) NOT NULL, 
	type VARCHAR(40), 
	place VARCHAR(120), 
	phone VARCHAR(20), 
	hours VARCHAR(80), 
	services TEXT, 
	PRIMARY KEY (id)
)

;


CREATE TABLE triage_rules (
	id SERIAL NOT NULL, 
	name VARCHAR(120) NOT NULL, 
	category VARCHAR(40), 
	config TEXT, 
	points INTEGER, 
	priority VARCHAR(20), 
	description TEXT, 
	active BOOLEAN, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	PRIMARY KEY (id)
)

;


CREATE TABLE users (
	id SERIAL NOT NULL, 
	username VARCHAR(64) NOT NULL, 
	email VARCHAR(120) NOT NULL, 
	hashed_password VARCHAR(255) NOT NULL, 
	full_name VARCHAR(120) NOT NULL, 
	role VARCHAR(20) NOT NULL, 
	is_active BOOLEAN, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	PRIMARY KEY (id)
)

;


CREATE TABLE audit_logs (
	id SERIAL NOT NULL, 
	user_id INTEGER, 
	action VARCHAR(80) NOT NULL, 
	entity VARCHAR(40), 
	entity_id INTEGER, 
	details TEXT, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)

;


CREATE TABLE chat_sessions (
	id SERIAL NOT NULL, 
	user_id INTEGER, 
	lang VARCHAR(5), 
	started_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)

;


CREATE TABLE doctors (
	id SERIAL NOT NULL, 
	user_id INTEGER, 
	department_id INTEGER, 
	full_name VARCHAR(120) NOT NULL, 
	specialization VARCHAR(120), 
	license_no VARCHAR(40) NOT NULL, 
	phone VARCHAR(20), 
	available BOOLEAN, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	FOREIGN KEY(department_id) REFERENCES departments (id), 
	UNIQUE (license_no)
)

;


CREATE TABLE emergency_requests (
	id SERIAL NOT NULL, 
	patient_name VARCHAR(120), 
	phone VARCHAR(20), 
	emergency_type VARCHAR(60), 
	location VARCHAR(200), 
	priority VARCHAR(20), 
	status VARCHAR(30), 
	ambulance_id INTEGER, 
	assigned_staff VARCHAR(120), 
	notes TEXT, 
	timeline TEXT, 
	created_by INTEGER, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	PRIMARY KEY (id), 
	FOREIGN KEY(ambulance_id) REFERENCES ambulances (id)
)

;


CREATE TABLE hospital_resources (
	id SERIAL NOT NULL, 
	ward_name VARCHAR(120) NOT NULL, 
	department_id INTEGER, 
	resource_type VARCHAR(40), 
	total INTEGER, 
	occupied INTEGER, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	PRIMARY KEY (id), 
	FOREIGN KEY(department_id) REFERENCES departments (id)
)

;


CREATE TABLE notifications (
	id SERIAL NOT NULL, 
	user_id INTEGER, 
	role_target VARCHAR(20), 
	type VARCHAR(40), 
	title VARCHAR(200), 
	message TEXT, 
	related_id INTEGER, 
	is_read BOOLEAN, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)

;


CREATE TABLE patients (
	id SERIAL NOT NULL, 
	patient_code VARCHAR(20) NOT NULL, 
	user_id INTEGER, 
	full_name VARCHAR(120) NOT NULL, 
	dob DATE, 
	age INTEGER NOT NULL, 
	gender VARCHAR(20), 
	phone VARCHAR(20), 
	email VARCHAR(120), 
	address TEXT, 
	emergency_contact_name VARCHAR(120), 
	emergency_contact_phone VARCHAR(20), 
	existing_conditions TEXT, 
	allergies TEXT, 
	medications TEXT, 
	created_by INTEGER, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)

;


CREATE TABLE user_settings (
	user_id INTEGER NOT NULL, 
	theme VARCHAR(10), 
	language VARCHAR(5), 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	PRIMARY KEY (user_id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)

;


CREATE TABLE wellness_logs (
	id SERIAL NOT NULL, 
	user_id INTEGER NOT NULL, 
	mood INTEGER, 
	note TEXT, 
	sleep_hours FLOAT, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)

;


CREATE TABLE appointments (
	id SERIAL NOT NULL, 
	patient_id INTEGER NOT NULL, 
	doctor_id INTEGER, 
	department_id INTEGER, 
	date DATE NOT NULL, 
	time_slot VARCHAR(20), 
	reason TEXT, 
	status VARCHAR(20), 
	notes TEXT, 
	created_by INTEGER, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	PRIMARY KEY (id), 
	FOREIGN KEY(patient_id) REFERENCES patients (id), 
	FOREIGN KEY(doctor_id) REFERENCES doctors (id), 
	FOREIGN KEY(department_id) REFERENCES departments (id)
)

;


CREATE TABLE chat_messages (
	id SERIAL NOT NULL, 
	session_id INTEGER NOT NULL, 
	role VARCHAR(10), 
	text TEXT, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	PRIMARY KEY (id), 
	FOREIGN KEY(session_id) REFERENCES chat_sessions (id)
)

;


CREATE TABLE doctor_schedules (
	id SERIAL NOT NULL, 
	doctor_id INTEGER NOT NULL, 
	weekday INTEGER NOT NULL, 
	start_time VARCHAR(5), 
	end_time VARCHAR(5), 
	slot_minutes INTEGER, 
	active BOOLEAN, 
	PRIMARY KEY (id), 
	FOREIGN KEY(doctor_id) REFERENCES doctors (id)
)

;


CREATE TABLE visits (
	id SERIAL NOT NULL, 
	patient_id INTEGER NOT NULL, 
	department_id INTEGER, 
	chief_complaint TEXT, 
	symptoms TEXT, 
	status VARCHAR(30), 
	assigned_doctor_id INTEGER, 
	priority VARCHAR(20), 
	priority_score INTEGER, 
	priority_reasons TEXT, 
	arrival_time TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	called_time TIMESTAMP WITH TIME ZONE, 
	started_time TIMESTAMP WITH TIME ZONE, 
	completed_time TIMESTAMP WITH TIME ZONE, 
	waiting_minutes INTEGER, 
	notes TEXT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(patient_id) REFERENCES patients (id), 
	FOREIGN KEY(department_id) REFERENCES departments (id), 
	FOREIGN KEY(assigned_doctor_id) REFERENCES doctors (id)
)

;


CREATE TABLE invoices (
	id SERIAL NOT NULL, 
	patient_id INTEGER NOT NULL, 
	visit_id INTEGER, 
	items TEXT, 
	total FLOAT, 
	status VARCHAR(20), 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	PRIMARY KEY (id), 
	FOREIGN KEY(patient_id) REFERENCES patients (id), 
	FOREIGN KEY(visit_id) REFERENCES visits (id)
)

;


CREATE TABLE triage_assessments (
	id SERIAL NOT NULL, 
	visit_id INTEGER NOT NULL, 
	patient_id INTEGER NOT NULL, 
	assessed_by INTEGER, 
	chief_complaint TEXT, 
	symptoms TEXT, 
	temperature FLOAT, 
	heart_rate FLOAT, 
	sbp FLOAT, 
	dbp FLOAT, 
	respiratory_rate FLOAT, 
	spo2 FLOAT, 
	consciousness VARCHAR(20), 
	pain_score INTEGER, 
	risk_factors TEXT, 
	warning_indicators TEXT, 
	notes TEXT, 
	suggested_priority VARCHAR(20), 
	suggested_score INTEGER, 
	suggested_reasons TEXT, 
	final_priority VARCHAR(20), 
	override_reason TEXT, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	PRIMARY KEY (id), 
	FOREIGN KEY(visit_id) REFERENCES visits (id), 
	FOREIGN KEY(patient_id) REFERENCES patients (id), 
	FOREIGN KEY(assessed_by) REFERENCES users (id)
)

;

