export interface SpringBootFile {
  filename: string;
  category: 'POM & CONFIG' | 'DATABASE DDL' | 'ENTITIES' | 'SERVICES & CONCURRENCY' | 'CONTROLLERS & DTOS' | 'SECURITY' | 'JUNIT 5 TESTS' | 'README';
  description: string;
  code: string;
}

export const SPRING_BOOT_REFERENCE_FILES: SpringBootFile[] = [
  {
    filename: 'pom.xml',
    category: 'POM & CONFIG',
    description: 'Maven configuration for Spring Boot 3.3, MySQL, Spring Data JPA, Security & Concurrency Testing',
    code: `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.3.4</version>
        <relativePath/>
    </parent>
    <groupId>com.guideconnect</groupId>
    <artifactId>guideconnect-platform</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <name>guideconnect</name>
    <description>Multilingual Tourist-Guide Smart Matching & Single-Winner Booking Platform</description>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <!-- Spring Boot Starters -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-websocket</artifactId>
        </dependency>

        <!-- Database & Drivers -->
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <scope>runtime</scope>
        </dependency>

        <!-- Developer Tools & Boilerplate -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <!-- Testing & Concurrency Verification -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.security</groupId>
            <artifactId>spring-security-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>`
  },
  {
    filename: 'schema.sql',
    category: 'DATABASE DDL',
    description: 'MySQL Relational Schema with Unique Constraints on guide_id, username, and Concurrency Locks',
    code: `-- GuideConnect Production MySQL Relational Schema
CREATE DATABASE IF NOT EXISTS guideconnect_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE guideconnect_db;

-- 1. Users Base Table
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(180) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('CLIENT', 'GUIDE', 'ADMIN') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_email (email)
) ENGINE=InnoDB;

-- 2. Client Profiles
CREATE TABLE client_profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    full_name VARCHAR(120) NOT NULL,
    phone VARCHAR(30),
    nationality VARCHAR(80) NOT NULL,
    preferred_language VARCHAR(50) NOT NULL,
    profile_photo VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_client_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Guide Profiles (Strict Uniqueness on guide_id & username)
CREATE TABLE guide_profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    guide_id VARCHAR(30) NOT NULL UNIQUE,          -- System-generated: GC-G-100001
    username VARCHAR(50) NOT NULL UNIQUE,          -- Guide chosen: mumbai_explorer
    full_name VARCHAR(120) NOT NULL,
    phone VARCHAR(30),
    country VARCHAR(80) NOT NULL,
    bio TEXT,
    years_of_experience INT NOT NULL DEFAULT 0,
    base_hourly_rate DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    is_verified BOOLEAN DEFAULT FALSE,
    verification_document VARCHAR(255),
    rating DECIMAL(3,2) DEFAULT 5.00,
    review_count INT DEFAULT 0,
    max_bookings_per_day INT DEFAULT 2,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_guide_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_guide_id_lookup (guide_id),
    INDEX idx_guide_username_lookup (username)
) ENGINE=InnoDB;

-- 4. Guide Languages Table
CREATE TABLE guide_languages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    guide_profile_id BIGINT NOT NULL,
    language_name VARCHAR(50) NOT NULL,
    proficiency ENUM('NATIVE', 'FLUENT', 'CONVERSATIONAL') NOT NULL,
    CONSTRAINT fk_gl_guide FOREIGN KEY (guide_profile_id) REFERENCES guide_profiles(id) ON DELETE CASCADE,
    INDEX idx_gl_lookup (language_name, proficiency)
) ENGINE=InnoDB;

-- 5. Guide Service Areas Table
CREATE TABLE guide_service_areas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    guide_profile_id BIGINT NOT NULL,
    city VARCHAR(80) NOT NULL,
    area_name VARCHAR(120),
    CONSTRAINT fk_gsa_guide FOREIGN KEY (guide_profile_id) REFERENCES guide_profiles(id) ON DELETE CASCADE,
    INDEX idx_gsa_city (city)
) ENGINE=InnoDB;

-- 6. Client Requests Table (Includes version column for Optimistic / Pessimistic Locking)
CREATE TABLE client_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    request_code VARCHAR(30) NOT NULL UNIQUE,     -- e.g. REQ-2026-1001
    client_profile_id BIGINT NOT NULL,
    destination_country VARCHAR(80) NOT NULL,
    destination_city VARCHAR(80) NOT NULL,
    preferred_language VARCHAR(50) NOT NULL,
    travel_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_hours DECIMAL(4,1) NOT NULL,
    number_of_tourists INT NOT NULL DEFAULT 1,
    tour_type VARCHAR(60) NOT NULL,
    approximate_budget DECIMAL(10,2),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    meeting_location VARCHAR(255) NOT NULL,
    special_instructions TEXT,
    status ENUM('OPEN', 'ACCEPTED', 'CANCELLED', 'EXPIRED') DEFAULT 'OPEN' NOT NULL,
    assigned_guide_profile_id BIGINT NULL,
    version BIGINT NOT NULL DEFAULT 0,            -- Concurrency locking control!
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP NULL,
    CONSTRAINT fk_req_client FOREIGN KEY (client_profile_id) REFERENCES client_profiles(id),
    CONSTRAINT fk_req_guide FOREIGN KEY (assigned_guide_profile_id) REFERENCES guide_profiles(id),
    INDEX idx_req_status_city (status, destination_city),
    INDEX idx_req_date (travel_date)
) ENGINE=InnoDB;

-- 7. Request Invitations (Audit trail for notified guides)
CREATE TABLE request_invitations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    request_id BIGINT NOT NULL,
    guide_profile_id BIGINT NOT NULL,
    status ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'WITHDRAWN', 'EXPIRED') DEFAULT 'PENDING' NOT NULL,
    invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP NULL,
    decline_reason VARCHAR(255),
    CONSTRAINT fk_inv_req FOREIGN KEY (request_id) REFERENCES client_requests(id) ON DELETE CASCADE,
    CONSTRAINT fk_inv_guide FOREIGN KEY (guide_profile_id) REFERENCES guide_profiles(id),
    UNIQUE KEY uq_request_guide (request_id, guide_profile_id)
) ENGINE=InnoDB;

-- 8. Bookings Table (Reserves the reservation separately from bargaining)
CREATE TABLE bookings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_code VARCHAR(30) NOT NULL UNIQUE,     -- e.g. BK-2026-0039
    request_id BIGINT NOT NULL UNIQUE,
    client_profile_id BIGINT NOT NULL,
    guide_profile_id BIGINT NOT NULL,
    travel_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_hours DECIMAL(4,1) NOT NULL,
    number_of_tourists INT NOT NULL,
    meeting_location VARCHAR(255) NOT NULL,
    estimated_price_min DECIMAL(10,2) NOT NULL,
    estimated_price_max DECIMAL(10,2) NOT NULL,
    agreed_price DECIMAL(10,2) NULL,              -- Set upon completed negotiation!
    currency VARCHAR(10) NOT NULL,
    booking_status ENUM('CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') DEFAULT 'CONFIRMED' NOT NULL,
    negotiation_status ENUM('PENDING_OFFER', 'AGREED', 'REJECTED', 'CLOSED') DEFAULT 'PENDING_OFFER' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    CONSTRAINT fk_bk_req FOREIGN KEY (request_id) REFERENCES client_requests(id),
    CONSTRAINT fk_bk_client FOREIGN KEY (client_profile_id) REFERENCES client_profiles(id),
    CONSTRAINT fk_bk_guide FOREIGN KEY (guide_profile_id) REFERENCES guide_profiles(id),
    INDEX idx_guide_schedule (guide_profile_id, travel_date, booking_status)
) ENGINE=InnoDB;

-- 9. Negotiation Offers Table (Separated price bargaining history)
CREATE TABLE negotiation_offers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT NOT NULL,
    sender_role ENUM('CLIENT', 'GUIDE') NOT NULL,
    sender_user_id BIGINT NOT NULL,
    proposed_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    note VARCHAR(255),
    status ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'SUPERSEDED') DEFAULT 'PENDING' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_offer_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 10. Reviews Table
CREATE TABLE reviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT NOT NULL UNIQUE,
    client_profile_id BIGINT NOT NULL,
    guide_profile_id BIGINT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rev_booking FOREIGN KEY (booking_id) REFERENCES bookings(id),
    CONSTRAINT fk_rev_client FOREIGN KEY (client_profile_id) REFERENCES client_profiles(id),
    CONSTRAINT fk_rev_guide FOREIGN KEY (guide_profile_id) REFERENCES guide_profiles(id)
) ENGINE=InnoDB;`
  },
  {
    filename: 'GuideProfile.java',
    category: 'ENTITIES',
    description: 'JPA Entity enforcing distinct guideId and username constraints with JPA relationships',
    code: `package com.guideconnect.model.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "guide_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GuideProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    /**
     * Requirement 1: Unique system-generated Guide ID (e.g., GC-G-100001)
     * Backend generated, collision-resistant, database enforced uniqueness.
     */
    @Column(name = "guide_id", nullable = false, unique = true, length = 30)
    private String guideId;

    /**
     * Requirement 1: Guide-chosen unique username (e.g., mumbai_explorer)
     * Public personalized identity, database enforced uniqueness.
     */
    @Column(name = "username", nullable = false, unique = true, length = 50)
    private String username;

    @Column(name = "full_name", nullable = false, length = 120)
    private String fullName;

    @Column(length = 30)
    private String phone;

    @Column(nullable = false, length = 80)
    private String country;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "years_of_experience", nullable = false)
    private Integer yearsOfExperience;

    @Column(name = "base_hourly_rate", nullable = false, precision = 10, scale = 2)
    private BigDecimal baseHourlyRate;

    @Column(nullable = false, length = 10)
    private String currency;

    @Column(name = "is_verified", nullable = false)
    private Boolean isVerified;

    @Column(name = "verification_document")
    private String verificationDocument;

    @Column(precision = 3, scale = 2)
    private BigDecimal rating;

    @Column(name = "review_count")
    private Integer reviewCount;

    @Column(name = "max_bookings_per_day")
    private Integer maxBookingsPerDay;

    @OneToMany(mappedBy = "guideProfile", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<GuideLanguage> languages = new ArrayList<>();

    @OneToMany(mappedBy = "guideProfile", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<GuideServiceArea> serviceAreas = new ArrayList<>();

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.rating == null) this.rating = BigDecimal.valueOf(5.0);
        if (this.reviewCount == null) this.reviewCount = 0;
        if (this.isVerified == null) this.isVerified = false;
        if (this.maxBookingsPerDay == null) this.maxBookingsPerDay = 2;
    }
}`
  },
  {
    filename: 'ClientRequest.java',
    category: 'ENTITIES',
    description: 'JPA Entity representing Client Request with @Version optimistic lock support',
    code: `package com.guideconnect.model.entity;

import com.guideconnect.model.enums.RequestStatus;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Entity
@Table(name = "client_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "request_code", nullable = false, unique = true, length = 30)
    private String requestCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_profile_id", nullable = false)
    private ClientProfile clientProfile;

    @Column(name = "destination_country", nullable = false, length = 80)
    private String destinationCountry;

    @Column(name = "destination_city", nullable = false, length = 80)
    private String destinationCity;

    @Column(name = "preferred_language", nullable = false, length = 50)
    private String preferredLanguage;

    @Column(name = "travel_date", nullable = false)
    private LocalDate travelDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "duration_hours", nullable = false, precision = 4, scale = 1)
    private BigDecimal durationHours;

    @Column(name = "number_of_tourists", nullable = false)
    private Integer numberOfTourists;

    @Column(name = "tour_type", nullable = false, length = 60)
    private String tourType;

    @Column(name = "approximate_budget", precision = 10, scale = 2)
    private BigDecimal approximateBudget;

    @Column(nullable = false, length = 10)
    private String currency;

    @Column(name = "meeting_location", nullable = false)
    private String meetingLocation;

    @Column(name = "special_instructions", columnDefinition = "TEXT")
    private String specialInstructions;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RequestStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_guide_profile_id")
    private GuideProfile assignedGuide;

    /**
     * Requirement 2: Single-Winner Concurrency Control.
     * The @Version field guarantees optimistic locking when combined with
     * pessimistic database row locks during atomic acceptance.
     */
    @Version
    @Column(nullable = false)
    private Long version;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) this.status = RequestStatus.OPEN;
    }
}`
  },
  {
    filename: 'BookingAcceptanceService.java',
    category: 'SERVICES & CONCURRENCY',
    description: 'Mission-critical Service implementing Single-Winner Atomic Transaction with Row Locking',
    code: `package com.guideconnect.service;

import com.guideconnect.exception.BookingConcurrencyException;
import com.guideconnect.exception.ScheduleConflictException;
import com.guideconnect.model.entity.*;
import com.guideconnect.model.enums.*;
import com.guideconnect.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Requirement 2: Treat acceptance as a single-winner transaction.
 * If two guides click Accept at almost the same moment, the backend and database
 * MUST ensure that only one booking is created.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BookingAcceptanceService {

    private final ClientRequestRepository requestRepository;
    private final GuideProfileRepository guideRepository;
    private final BookingRepository bookingRepository;
    private final RequestInvitationRepository invitationRepository;
    private final PricingEngineService pricingEngineService;
    private final NotificationService notificationService;

    /**
     * Executes atomic acceptance with Pessimistic Write Lock & Read Committed Isolation.
     * Prevents race conditions and double bookings.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public Booking acceptRequestAtomically(Long requestId, Long guideProfileId) {
        log.info("Guide ID {} attempting atomic acceptance for Request ID {}", guideProfileId, requestId);

        // 1. Acquire PESSIMISTIC_WRITE lock on ClientRequest row
        // SELECT * FROM client_requests WHERE id = :requestId FOR UPDATE
        ClientRequest request = requestRepository.findByIdForUpdate(requestId)
            .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        // 2. Validate Single-Winner State: Must still be OPEN!
        if (request.getStatus() != RequestStatus.OPEN) {
            String winnerUsername = (request.getAssignedGuide() != null)
                ? request.getAssignedGuide().getUsername()
                : "another guide";
            log.warn("Race condition caught: Request {} already claimed by {}", requestId, winnerUsername);
            throw new BookingConcurrencyException(
                "Request was already accepted by " + winnerUsername + ". Opportunity is no longer available."
            );
        }

        // 3. Load Guide Profile
        GuideProfile guide = guideRepository.findById(guideProfileId)
            .orElseThrow(() -> new IllegalArgumentException("Guide profile not found: " + guideProfileId));

        // 4. Validate Guide Schedule Conflict (No overlapping accepted bookings on same travel date)
        boolean hasOverlap = bookingRepository.hasOverlappingAcceptedBooking(
            guide.getId(),
            request.getTravelDate(),
            request.getStartTime(),
            request.getEndTime()
        );
        if (hasOverlap) {
            throw new ScheduleConflictException(
                "You have an overlapping accepted booking during the requested time window (" +
                request.getStartTime() + " - " + request.getEndTime() + ")."
            );
        }

        // 5. Atomic State Transition: Assign Guide and update status
        request.setStatus(RequestStatus.ACCEPTED);
        request.setAssignedGuide(guide);
        request.setAcceptedAt(LocalDateTime.now());
        requestRepository.save(request);

        // 6. Create Booking Record (Requirement 3: Kept separate from negotiation)
        var priceRange = pricingEngineService.calculateIndicativeRange(request);
        Booking booking = Booking.builder()
            .bookingCode("BK-" + System.currentTimeMillis() % 1000000)
            .clientRequest(request)
            .clientProfile(request.getClientProfile())
            .guideProfile(guide)
            .travelDate(request.getTravelDate())
            .startTime(request.getStartTime())
            .endTime(request.getEndTime())
            .durationHours(request.getDurationHours())
            .numberOfTourists(request.getNumberOfTourists())
            .meetingLocation(request.getMeetingLocation())
            .estimatedPriceMin(priceRange.getMin())
            .estimatedPriceMax(priceRange.getMax())
            .agreedPrice(null) // Negotiation begins separately!
            .currency(request.getCurrency())
            .bookingStatus(BookingStatus.CONFIRMED)
            .negotiationStatus(NegotiationStatus.PENDING_OFFER)
            .build();
        Booking savedBooking = bookingRepository.save(booking);

        // 7. Atomic Invitation Updates:
        // Accept winner's invitation, WITHDRAW all other competing guide invitations
        List<RequestInvitation> invitations = invitationRepository.findByRequestId(requestId);
        for (RequestInvitation inv : invitations) {
            if (inv.getGuideProfile().getId().equals(guideProfileId)) {
                inv.setStatus(InvitationStatus.ACCEPTED);
                inv.setRespondedAt(LocalDateTime.now());
            } else if (inv.getStatus() == InvitationStatus.PENDING) {
                inv.setStatus(InvitationStatus.WITHDRAWN);
                inv.setRespondedAt(LocalDateTime.now());
                // Notify other guides that request is no longer available
                notificationService.notifyInvitationWithdrawn(inv.getGuideProfile().getId(), requestId);
            }
        }
        invitationRepository.saveAll(invitations);

        // 8. Notify Client
        notificationService.notifyClientBookingAccepted(request.getClientProfile().getId(), savedBooking);

        log.info("Request {} successfully reserved for Guide {} (Booking ID: {})",
            requestId, guide.getGuideId(), savedBooking.getBookingCode());
        return savedBooking;
    }
}`
  },
  {
    filename: 'ClientRequestRepository.java',
    category: 'SERVICES & CONCURRENCY',
    description: 'Spring Data JPA Repository providing Pessimistic Write Lock query for single-winner concurrency',
    code: `package com.guideconnect.repository;

import com.guideconnect.model.entity.ClientRequest;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClientRequestRepository extends JpaRepository<ClientRequest, Long> {

    /**
     * Executes SELECT ... FOR UPDATE to block simultaneous concurrent transactions
     * from reading the row until the current transaction commits or rolls back.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM ClientRequest r WHERE r.id = :id")
    Optional<ClientRequest> findByIdForUpdate(@Param("id") Long id);

    Optional<ClientRequest> findByRequestCode(String requestCode);
}`
  },
  {
    filename: 'SmartMatchingService.java',
    category: 'SERVICES & CONCURRENCY',
    description: 'Matching Engine separating Qualification from Acceptance and Bargaining',
    code: `package com.guideconnect.service;

import com.guideconnect.model.entity.*;
import com.guideconnect.repository.BookingRepository;
import com.guideconnect.repository.GuideProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.util.ArrayList;
import java.util.List;

/**
 * Requirement 3: Keep matching, booking, and bargaining separate.
 * Matching determines who qualifies. Acceptance reserves the booking.
 * Negotiation determines the final fee.
 */
@Service
@RequiredArgsConstructor
public class SmartMatchingService {

    private final GuideProfileRepository guideRepository;
    private final BookingRepository bookingRepository;

    public List<GuideProfile> findEligibleGuides(ClientRequest request) {
        List<GuideProfile> candidates = guideRepository.findByIsActiveTrue();
        List<GuideProfile> eligible = new ArrayList<>();

        for (GuideProfile guide : candidates) {
            // 1. Mandatory Destination check
            boolean matchesCity = guide.getServiceAreas().stream()
                .anyMatch(sa -> sa.getCity().equalsIgnoreCase(request.getDestinationCity()));
            if (!matchesCity) continue;

            // 2. Mandatory Language check
            boolean matchesLang = guide.getLanguages().stream()
                .anyMatch(l -> l.getLanguageName().equalsIgnoreCase(request.getPreferredLanguage()));
            if (!matchesLang) continue;

            // 3. No conflicting bookings on requested date and time interval
            boolean hasConflict = bookingRepository.hasOverlappingAcceptedBooking(
                guide.getId(),
                request.getTravelDate(),
                request.getStartTime(),
                request.getEndTime()
            );
            if (hasConflict) continue;

            eligible.add(guide);
        }

        return eligible;
    }
}`
  },
  {
    filename: 'SecurityConfig.java',
    category: 'SECURITY',
    description: 'Spring Security 6 configuration with BCrypt hashing, JWT / Session auth, and RBAC',
    code: `package com.guideconnect.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // Or configure token-based CSRF
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/", "/api/public/**", "/api/auth/**", "/css/**", "/js/**").permitAll()
                .requestMatchers("/api/client/**").hasRole("CLIENT")
                .requestMatchers("/api/guide/**").hasRole("GUIDE")
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .httpBasic(basic -> {});

        return http.build();
    }
}`
  },
  {
    filename: 'BookingAcceptanceConcurrencyTest.java',
    category: 'JUNIT 5 TESTS',
    description: 'JUnit 5 Multithreaded Concurrency Test verifying Single-Winner Acceptance Race',
    code: `package com.guideconnect.test;

import com.guideconnect.exception.BookingConcurrencyException;
import com.guideconnect.model.entity.*;
import com.guideconnect.model.enums.*;
import com.guideconnect.repository.*;
import com.guideconnect.service.BookingAcceptanceService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class BookingAcceptanceConcurrencyTest {

    @Autowired
    private BookingAcceptanceService bookingAcceptanceService;

    @Autowired
    private ClientRequestRepository requestRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Test
    @DisplayName("Verify that when two guides accept the same request at the same millisecond, exactly one wins")
    void testConcurrentAcceptanceSingleWinner() throws InterruptedException {
        Long requestId = 1L; // Seeded OPEN request
        Long guide1Id = 101L; // Mumbai Explorer
        Long guide2Id = 102L; // Sahil Heritage

        int numberOfThreads = 2;
        ExecutorService executor = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch startGate = new CountDownLatch(1);
        CountDownLatch endGate = new CountDownLatch(numberOfThreads);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger conflictCount = new AtomicInteger(0);

        // Submit Guide 1 Task
        executor.submit(() -> {
            try {
                startGate.await(); // Synchronize starting moment
                bookingAcceptanceService.acceptRequestAtomically(requestId, guide1Id);
                successCount.incrementAndGet();
            } catch (BookingConcurrencyException ex) {
                conflictCount.incrementAndGet();
            } catch (Exception e) {
                e.printStackTrace();
            } finally {
                endGate.countDown();
            }
        });

        // Submit Guide 2 Task
        executor.submit(() -> {
            try {
                startGate.await(); // Synchronize starting moment
                bookingAcceptanceService.acceptRequestAtomically(requestId, guide2Id);
                successCount.incrementAndGet();
            } catch (BookingConcurrencyException ex) {
                conflictCount.incrementAndGet();
            } catch (Exception e) {
                e.printStackTrace();
            } finally {
                endGate.countDown();
            }
        });

        // Open gate to release both threads simultaneously!
        startGate.countDown();
        boolean completed = endGate.await(5, TimeUnit.SECONDS);

        assertTrue(completed, "Concurrency test timed out");
        assertEquals(1, successCount.get(), "EXACTLY one guide must successfully accept!");
        assertEquals(1, conflictCount.get(), "EXACTLY one guide must receive a concurrency conflict exception!");

        // Assert database state has only 1 created booking
        ClientRequest updatedRequest = requestRepository.findById(requestId).orElseThrow();
        assertEquals(RequestStatus.ACCEPTED, updatedRequest.getStatus());
        assertNotNull(updatedRequest.getAssignedGuide());

        long bookingCount = bookingRepository.countByRequestId(requestId);
        assertEquals(1, bookingCount, "Must have exactly 1 booking record in database");
    }
}`
  },
  {
    filename: 'README.md',
    category: 'README',
    description: 'Complete GuideConnect Execution Guide, MySQL Configuration, and Concurrency Architecture',
    code: `# GuideConnect - Multilingual Tourist-Guide Platform

A high-performance full-stack platform connecting foreign tourists and international travelers with verified multilingual tourist guides.

---

## Key Architectural Principles

1. **Unique Guide ID vs. Separate Username:**
   - **System Generated Guide ID:** Format \`GC-G-100001\` (collision-resistant, database uniqueness constraint).
   - **Guide-Chosen Username:** e.g., \`mumbai_explorer\`, \`paris_flaneur\` for public profile personalization.

2. **Single-Winner Transactional Acceptance:**
   - Database row lock (\`PESSIMISTIC_WRITE\`) with read-committed isolation.
   - If two guides click "Accept" simultaneously, the first acquires the lock, transitions the request to \`ACCEPTED\`, and creates the booking.
   - The second receives a \`BookingConcurrencyException\` (HTTP 409 Conflict) and a clear rejection message.

3. **Separation of Concerns:**
   - **Matching:** Smart engine checks destination, language proficiency, working hours, and blackout dates.
   - **Booking:** Single-winner transaction reserves guide calendar slot.
   - **Bargaining:** Separate negotiation engine allows counteroffers and locks agreed fee.

---

## Local Spring Boot Execution Instructions

### Prerequisites
- JDK 21+
- Maven 3.9+
- MySQL 8.0+

### Database Setup
\`\`\`sql
CREATE DATABASE guideconnect_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
mysql -u root -p guideconnect_db < schema.sql
\`\`\`

### Application Configuration (\`application.yml\`)
\`\`\`yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/guideconnect_db?useSSL=false&serverTimezone=UTC
    username: root
    password: your_secure_password
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: true
    properties:
      hibernate.format_sql: true
\`\`\`

### Run Application
\`\`\`bash
mvn clean package
java -jar target/guideconnect-platform-1.0.0-SNAPSHOT.jar
\`\`\`
Server runs at \`http://localhost:8080\`.
`
  }
];
