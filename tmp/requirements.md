# Requirements Document

## Introduction

A UK-based web marketplace that connects A-Level and University students who wish to offer tutoring services with school students (Year 7 to GCSE and A-Level) and their parents who are looking to hire affordable tutors. The platform operates similarly to firsttutors.com/uk but is exclusively for A-Level and University students as tutors, who typically charge lower fees than qualified teachers. Tutors register and list their subjects and availability; customers register and pay to access tutor contact details.

## Glossary

- **Tutor**: A UK-based A-Level or University student who registers on the platform to offer tutoring services.
- **Customer**: A school student (Year 7 to A-Level) or their parent/guardian who registers on the platform to find and book a tutor.
- **Subject**: An academic subject offered for tutoring (e.g., Maths, English, Biology, Chemistry, Physics, History, etc.).
- **Availability**: The days of the week and time slots during which a Tutor is available to provide tutoring sessions.
- **Profile**: A Tutor's public listing containing their name, education level, subjects, and availability (excluding contact details).
- **Contact Details**: A Tutor's private information (email address and/or phone number) revealed only to verified, paying Customers.
- **Registration**: The process by which a Tutor or Customer creates an account on the Platform.
- **Platform**: The UK Tutor Marketplace web application.
- **Payment**: A one-time or subscription fee paid by a Customer to unlock a Tutor's contact details.
- **Search**: The mechanism by which Customers query the Platform for Tutors by subject, year group, or availability.
- **Year_Group**: The UK school year level of the student seeking tutoring, ranging from Year 7 to Year 13 (A-Level).

---

## Requirements

### Requirement 1: Tutor Registration

**User Story:** As an A-Level or University student, I want to register on the platform as a tutor, so that I can advertise my tutoring services to potential students and parents.

#### Acceptance Criteria

1. THE Platform SHALL provide a tutor registration form collecting: full name, email address, phone number, current education level (A-Level or University), university or school name, subjects offered, year groups taught, hourly rate, and a short bio.
2. WHEN a prospective Tutor submits the registration form, THE Platform SHALL validate that the email address is in a valid format before creating the account.
3. WHEN a prospective Tutor submits the registration form, THE Platform SHALL validate that at least one subject and one year group have been selected before creating the account.
4. WHEN a prospective Tutor submits a registration form with an email address already associated with an existing account, THE Platform SHALL display an error message stating the email is already registered.
5. WHEN a Tutor completes registration successfully, THE Platform SHALL send a verification email to the provided email address.
6. WHEN a Tutor clicks the verification link in the email, THE Platform SHALL activate the Tutor's account and make their Profile visible in search results.
7. IF a Tutor attempts to log in before verifying their email, THEN THE Platform SHALL display a message prompting the Tutor to verify their email address.

---

### Requirement 2: Tutor Availability Management

**User Story:** As a registered Tutor, I want to set and update my availability for all 7 days of the week, so that Customers can see when I am free to tutor.

#### Acceptance Criteria

1. THE Platform SHALL provide an availability management interface allowing Tutors to specify available time slots for each of the 7 days of the week (Monday through Sunday).
2. WHEN a Tutor saves their availability, THE Platform SHALL store the selected days and time slots and immediately reflect the updated availability on the Tutor's public Profile.
3. WHEN a Tutor marks a day as unavailable, THE Platform SHALL display that day as unavailable on the Tutor's public Profile.
4. WHILE a Tutor is logged in, THE Platform SHALL allow the Tutor to update their availability at any time.
5. THE Platform SHALL allow Tutors to specify availability in one-hour time slots between 06:00 and 22:00 for each day.

---

### Requirement 3: Tutor Profile Management

**User Story:** As a registered Tutor, I want to manage my profile details, so that my listing remains accurate and up to date for potential Customers.

#### Acceptance Criteria

1. WHILE a Tutor is logged in, THE Platform SHALL allow the Tutor to update their bio, subjects offered, year groups taught, hourly rate, and availability.
2. WHEN a Tutor updates their profile, THE Platform SHALL save the changes and display the updated information on the Tutor's public Profile within 60 seconds.
3. THE Platform SHALL display the Tutor's name, education level, institution name, subjects, year groups taught, hourly rate, bio, and availability on the public Profile.
4. THE Platform SHALL NOT display the Tutor's email address or phone number on the public Profile.

---

### Requirement 4: Customer Registration

**User Story:** As a school student or parent, I want to register on the platform as a customer, so that I can search for tutors and access their contact details after payment.

#### Acceptance Criteria

1. THE Platform SHALL provide a customer registration form collecting: full name, email address, phone number, and role (Student or Parent/Guardian).
2. WHEN a Customer selects the role of Student, THE Platform SHALL additionally collect the student's current Year Group (Year 7 to Year 13).
3. WHEN a prospective Customer submits the registration form, THE Platform SHALL validate that the email address is in a valid format before creating the account.
4. WHEN a prospective Customer submits a registration form with an email address already associated with an existing account, THE Platform SHALL display an error message stating the email is already registered.
5. WHEN a Customer completes registration successfully, THE Platform SHALL send a confirmation email to the provided email address.
6. WHEN a Customer clicks the confirmation link in the email, THE Platform SHALL activate the Customer's account.

---

### Requirement 5: Tutor Search

**User Story:** As a Customer, I want to search for tutors by subject, year group, and availability, so that I can find a suitable tutor quickly.

#### Acceptance Criteria

1. THE Platform SHALL provide a search interface accessible without requiring login, allowing visitors to search for Tutors by subject.
2. WHEN a visitor or Customer submits a search query with a subject, THE Platform SHALL return a list of all verified Tutors offering that subject, ordered by relevance.
3. WHEN a Customer applies a year group filter, THE Platform SHALL return only Tutors who have listed that Year_Group as one they teach.
4. WHEN a Customer applies an availability filter for a specific day, THE Platform SHALL return only Tutors who have marked that day as available.
5. WHEN a search returns no results, THE Platform SHALL display a message informing the user that no tutors were found for the given criteria and suggest broadening the search.
6. THE Platform SHALL display each Tutor's name, subjects, year groups taught, hourly rate, availability summary, and education level in the search results list.
7. THE Platform SHALL NOT display a Tutor's contact details (email or phone number) in the search results list.

---

### Requirement 6: Tutor Contact Detail Access (Payment Gate)

**User Story:** As a registered Customer, I want to pay to access a tutor's contact details, so that I can get in touch with the tutor directly to arrange sessions.

#### Acceptance Criteria

1. WHEN an unregistered visitor attempts to view a Tutor's contact details, THE Platform SHALL redirect the visitor to the Customer registration page.
2. WHEN a registered but unpaid Customer attempts to view a Tutor's contact details, THE Platform SHALL prompt the Customer to complete a payment before revealing the contact details.
3. WHEN a Customer completes a payment successfully, THE Platform SHALL reveal the Tutor's email address and phone number to that Customer.
4. WHEN a payment is completed, THE Platform SHALL send a confirmation email to the Customer containing the Tutor's contact details.
5. IF a payment transaction fails, THEN THE Platform SHALL display an error message to the Customer and retain the Tutor's contact details as hidden.
6. THE Platform SHALL process payments using a secure third-party payment provider (e.g., Stripe).
7. THE Platform SHALL store a record of each completed payment associated with the Customer and the Tutor whose details were unlocked.

---

### Requirement 7: Tutor Listing Page

**User Story:** As a Customer, I want to browse all available tutors, so that I can compare options before choosing one.

#### Acceptance Criteria

1. THE Platform SHALL provide a publicly accessible tutor listing page displaying all verified Tutor Profiles.
2. THE Platform SHALL display each Tutor's name, education level, subjects, year groups taught, hourly rate, and availability summary on the listing page.
3. THE Platform SHALL support pagination or infinite scroll on the tutor listing page, displaying a maximum of 20 Tutor Profiles per page.
4. WHEN a Customer clicks on a Tutor's listing, THE Platform SHALL navigate to that Tutor's full Profile page.

---

### Requirement 8: Authentication and Account Security

**User Story:** As a registered user (Tutor or Customer), I want to securely log in and manage my account, so that my personal data is protected.

#### Acceptance Criteria

1. THE Platform SHALL require users to authenticate with an email address and password to access account features.
2. WHEN a user enters an incorrect password 5 consecutive times, THE Platform SHALL temporarily lock the account for 15 minutes and notify the user by email.
3. THE Platform SHALL store all passwords using a cryptographic hashing algorithm (bcrypt or equivalent) and SHALL NOT store passwords in plain text.
4. THE Platform SHALL use HTTPS for all data transmission between the browser and the server.
5. WHEN a user requests a password reset, THE Platform SHALL send a time-limited reset link (valid for 60 minutes) to the registered email address.
6. IF a password reset link has expired, THEN THE Platform SHALL inform the user that the link has expired and prompt them to request a new one.

---

### Requirement 9: UK Subject Coverage

**User Story:** As a Tutor, I want to select from a comprehensive list of UK curriculum subjects, so that my listing accurately reflects what I can teach.

#### Acceptance Criteria

1. THE Platform SHALL provide a predefined list of subjects aligned with the UK national curriculum for GCSE and A-Level, including at minimum: Mathematics, English Language, English Literature, Biology, Chemistry, Physics, History, Geography, French, Spanish, German, Computer Science, Economics, Business Studies, Psychology, Sociology, and Art.
2. WHEN a Tutor registers or updates their profile, THE Platform SHALL allow the Tutor to select one or more subjects from the predefined list.
3. THE Platform SHALL allow Tutors to specify for each selected subject whether they offer tutoring at GCSE level, A-Level, or both.

---

### Requirement 10: Data Privacy and GDPR Compliance

**User Story:** As a user of the platform, I want my personal data to be handled in accordance with UK data protection law, so that my privacy is protected.

#### Acceptance Criteria

1. THE Platform SHALL display a Privacy Policy and Terms of Service accessible from every page via a footer link.
2. WHEN a new user registers, THE Platform SHALL require the user to explicitly accept the Privacy Policy and Terms of Service before the account is created.
3. THE Platform SHALL provide registered users with the ability to request deletion of their account and associated personal data.
4. WHEN a user requests account deletion, THE Platform SHALL permanently remove the user's personal data within 30 days in accordance with UK GDPR requirements.
5. THE Platform SHALL NOT share user personal data with third parties except as required to process payments via the designated payment provider.

