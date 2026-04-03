# Requirements Document

## Introduction

A UK-based web marketplace that connects A-Level and University students who wish to offer tutoring services with school students (Year 7 to GCSE and A-Level) and their parents who are looking to hire affordable tutors. The purpose of the platform is similar to firsttutors.com/uk.  However, in terms of how connections are built and communication happens, the platform works like LinkedIn: tutors and students/parents connect through a connection request flow, and once connected, all communication takes place via in-app messaging and chat. Tutor contact details are never shared outside the platform. Once connected, tutors can send payment requests via the app, and sessions are coordinated through in-app chat.

## Glossary

- **Tutor**: A UK-based A-Level or University student who registers on the platform to offer tutoring services.
- **Customer**: A school student (Year 7 to A-Level) or their parent/guardian who registers on the platform to find and book a tutor.
- **Subject**: An academic subject offered for tutoring (e.g., Maths, English, Biology, Chemistry, Physics, History, etc.).
- **Availability**: The days of the week and time slots during which a Tutor is available to provide tutoring sessions.
- **Profile**: A Tutor's public listing containing their name, education level, subjects, and availability (excluding contact details).
- **Registration**: The process by which a Tutor or Customer creates an account on the Platform.
- **Platform**: The UK Tutor Marketplace web application.
- **Connection**: A mutual relationship between a Customer and a Tutor, established when the Tutor accepts a Customer's connection request, enabling in-app communication.
- **Connection_Request**: An invitation sent by a Customer to a Tutor to establish a Connection.
- **Chat**: The in-app messaging interface through which connected Customers and Tutors communicate.
- **Message**: A text-based communication sent by a Customer or Tutor within a Chat conversation.
- **Payment_Request**: A request sent by a Tutor to a connected Customer via the app, specifying an amount to be paid for tutoring services.
- **Session_Link**: A URL (e.g., Google Meet) shared by a Tutor with a connected Customer via Chat to facilitate an online tutoring session.
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
4. THE Platform SHALL NOT display the Tutor's email address or phone number anywhere on the Platform to any Customer or visitor.

---

### Requirement 4: Customer Registration

**User Story:** As a school student or parent, I want to register on the platform as a customer, so that I can search for tutors and connect with them to arrange sessions.

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

### Requirement 6: Connection Requests

**User Story:** As a registered Customer, I want to send a connection request to a Tutor, so that I can establish a relationship and communicate with them in-app.

#### Acceptance Criteria

1. WHEN a registered Customer views a Tutor's Profile, THE Platform SHALL display a connection action button reflecting the current Connection status: "Connect" (no request sent), "Pending" (request sent, awaiting response), or "Connected" (connection established).
2. WHEN a Customer clicks "Connect" on a Tutor's Profile, THE Platform SHALL create a Connection_Request and send a notification to the Tutor.
3. WHEN a Tutor receives a Connection_Request, THE Platform SHALL allow the Tutor to Accept or Decline the request.
4. WHEN a Tutor accepts a Connection_Request, THE Platform SHALL establish a Connection between the Customer and the Tutor and notify the Customer.
5. WHEN a Tutor declines a Connection_Request, THE Platform SHALL notify the Customer that the request was declined and prevent the Customer from sending another Connection_Request to the same Tutor for 30 days.
6. WHEN an unregistered visitor attempts to send a Connection_Request, THE Platform SHALL redirect the visitor to the Customer registration page.
7. THE Platform SHALL display the current Connection status on the Tutor's Profile page for any logged-in Customer.

---

### Requirement 7: In-App Messaging

**User Story:** As a connected Customer or Tutor, I want to exchange messages in-app, so that we can communicate and coordinate sessions without sharing personal contact details.

#### Acceptance Criteria

1. WHEN a Connection is established between a Customer and a Tutor, THE Platform SHALL create a Chat conversation accessible to both parties.
2. WHILE a Customer or Tutor is viewing a Chat conversation, THE Platform SHALL allow them to send and receive Messages.
3. THE Platform SHALL display Messages in a Chat conversation in chronological order, oldest first.
4. THE Platform SHALL store the full Message history for each Chat conversation and display it to both the Customer and the Tutor.
5. THE Platform SHALL display an unread message count indicator to a user when they have unread Messages in any Chat conversation.
6. WHEN a new Message is received, THE Platform SHALL send a notification to the recipient.
7. THE Platform SHALL NOT reveal a Tutor's email address or phone number at any point within the Chat or elsewhere on the Platform.

---

### Requirement 8: Payment Requests

**User Story:** As a connected Tutor, I want to send a payment request to a Customer via the app, so that I can collect payment for tutoring sessions without exchanging contact details.

#### Acceptance Criteria

1. WHEN a Tutor is Connected to a Customer, THE Platform SHALL allow the Tutor to send a Payment_Request to that Customer specifying an amount (either the Tutor's hourly rate or a custom amount).
2. WHEN a Tutor sends a Payment_Request, THE Platform SHALL display the Payment_Request within the Chat conversation and notify the Customer.
3. WHEN a Customer receives a Payment_Request, THE Platform SHALL allow the Customer to pay the specified amount via Stripe within the app.
4. WHEN a Customer completes payment successfully, THE Platform SHALL notify the Tutor that payment has been received and record the payment against the Customer and Tutor.
5. IF a payment transaction fails, THEN THE Platform SHALL display an error message to the Customer and leave the Payment_Request in an unpaid state.
6. THE Platform SHALL process payments using Stripe and store a record of each completed payment associated with the Customer and the Tutor.

---

### Requirement 9: Session Link Sharing

**User Story:** As a connected Tutor, I want to share a session link with a Customer via in-app chat, so that we can conduct the tutoring session online.

#### Acceptance Criteria

1. WHEN a Tutor sends a Message containing a URL (e.g., a Google Meet link), THE Platform SHALL render the URL as a clickable link within the Chat conversation.
2. THE Platform SHALL allow Tutors to send Session_Links via Chat at any time after a Connection is established.
3. THE Platform SHALL display Session_Links sent by the Tutor to the Customer within the Chat conversation.

---

### Requirement 10: Tutor Listing Page

**User Story:** As a Customer, I want to browse all available tutors, so that I can compare options before choosing one.

#### Acceptance Criteria

1. THE Platform SHALL provide a publicly accessible tutor listing page displaying all verified Tutor Profiles.
2. THE Platform SHALL display each Tutor's name, education level, subjects, year groups taught, hourly rate, and availability summary on the listing page.
3. THE Platform SHALL support pagination or infinite scroll on the tutor listing page, displaying a maximum of 20 Tutor Profiles per page.
4. WHEN a Customer clicks on a Tutor's listing, THE Platform SHALL navigate to that Tutor's full Profile page.

---

### Requirement 11: Authentication and Account Security

**User Story:** As a registered user (Tutor or Customer), I want to securely log in and manage my account, so that my personal data is protected.

#### Acceptance Criteria

1. THE Platform SHALL require users to authenticate with an email address and password to access account features.
2. WHEN a user enters an incorrect password 5 consecutive times, THE Platform SHALL temporarily lock the account for 15 minutes and notify the user by email.
3. THE Platform SHALL store all passwords using a cryptographic hashing algorithm (bcrypt or equivalent) and SHALL NOT store passwords in plain text.
4. THE Platform SHALL use HTTPS for all data transmission between the browser and the server.
5. WHEN a user requests a password reset, THE Platform SHALL send a time-limited reset link (valid for 60 minutes) to the registered email address.
6. IF a password reset link has expired, THEN THE Platform SHALL inform the user that the link has expired and prompt them to request a new one.

---

### Requirement 12: UK Subject Coverage

**User Story:** As a Tutor, I want to select from a comprehensive list of UK curriculum subjects, so that my listing accurately reflects what I can teach.

#### Acceptance Criteria

1. THE Platform SHALL provide a predefined list of subjects aligned with the UK national curriculum for GCSE and A-Level, including at minimum: Mathematics, English Language, English Literature, Biology, Chemistry, Physics, History, Geography, French, Spanish, German, Computer Science, Economics, Business Studies, Psychology, Sociology, and Art.
2. WHEN a Tutor registers or updates their profile, THE Platform SHALL allow the Tutor to select one or more subjects from the predefined list.
3. THE Platform SHALL allow Tutors to specify for each selected subject whether they offer tutoring at GCSE level, A-Level, or both.

---

### Requirement 13: Data Privacy and GDPR Compliance

**User Story:** As a user of the platform, I want my personal data to be handled in accordance with UK data protection law, so that my privacy is protected.

#### Acceptance Criteria

1. THE Platform SHALL display a Privacy Policy and Terms of Service accessible from every page via a footer link.
2. WHEN a new user registers, THE Platform SHALL require the user to explicitly accept the Privacy Policy and Terms of Service before the account is created.
3. THE Platform SHALL provide registered users with the ability to request deletion of their account and associated personal data.
4. WHEN a user requests account deletion, THE Platform SHALL permanently remove the user's personal data within 30 days in accordance with UK GDPR requirements.
5. THE Platform SHALL NOT share user personal data with third parties except as required to process payments via the designated payment provider.

---

### Requirement 14: Tutor Ratings and Reviews

**User Story:** As a Customer, I want to leave a rating and review for a tutor I have had a session with, so that other Customers can make informed decisions when choosing a tutor.

#### Acceptance Criteria

1. WHEN a Customer has made a completed payment to a Tutor, THE Platform SHALL allow that Customer to submit a rating (1 to 5 stars) and an optional written review for that Tutor.
2. WHEN a Customer submits a review, THE Platform SHALL validate that the rating is an integer between 1 and 5 inclusive before saving the review.
3. WHEN a Customer submits a review, THE Platform SHALL display the review on the Tutor's public Profile within 60 seconds of submission.
4. THE Platform SHALL display the reviewer's first name, star rating, written review text, and submission date on the Tutor's public Profile.
5. THE Platform SHALL NOT display the reviewer's email address, phone number, or full surname on the Tutor's public Profile.
6. THE Platform SHALL calculate and display a Tutor's average star rating on their public Profile and in search results, rounded to one decimal place.
7. WHEN a Tutor has no reviews, THE Platform SHALL display a message indicating that no reviews have been submitted yet.
8. THE Platform SHALL allow each Customer to submit at most one review per Tutor.
9. WHEN a Customer attempts to submit a second review for the same Tutor, THE Platform SHALL display an error message and allow the Customer to edit their existing review instead.
10. IF a submitted review contains profanity or prohibited content as defined by the Platform's content policy, THEN THE Platform SHALL reject the review and display an appropriate error message to the Customer.

---

### Requirement 15: Admin Panel

**User Story:** As a platform administrator, I want an administrative interface, so that I can manage users, content, and platform operations effectively.

#### Acceptance Criteria

1. THE Platform SHALL provide an Admin Panel accessible only to users with the Administrator role, authenticated via the standard login flow.
2. WHEN a non-administrator user attempts to access the Admin Panel URL, THE Platform SHALL return a 403 Forbidden response and redirect the user to the home page.
3. THE Admin_Panel SHALL display a dashboard summarising key platform metrics, including: total registered Tutors, total registered Customers, total active Connections, total completed payments, and total submitted reviews.
4. WHILE an Administrator is logged in, THE Admin_Panel SHALL allow the Administrator to view, search, and filter all registered Tutor and Customer accounts.
5. WHEN an Administrator deactivates a Tutor account, THE Platform SHALL immediately remove the Tutor's Profile from search results and the tutor listing page.
6. WHEN an Administrator reactivates a previously deactivated Tutor account, THE Platform SHALL restore the Tutor's Profile to search results and the tutor listing page within 60 seconds.
7. WHILE an Administrator is logged in, THE Admin_Panel SHALL allow the Administrator to remove any review that violates the Platform's content policy.
8. WHEN an Administrator removes a review, THE Platform SHALL immediately hide the review from the Tutor's public Profile and recalculate the Tutor's average star rating.
9. THE Admin_Panel SHALL provide an audit log recording all administrative actions, including the Administrator's account identifier, the action performed, and a UTC timestamp.
10. THE Platform SHALL allow multiple Administrator accounts to be created and managed independently.
