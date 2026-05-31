package com.university.room_reservation.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.booking")
public class BookingLimitsProperties {

    private RoleLimits student = new RoleLimits();
    private RoleLimits teacher = new RoleLimits();

    public RoleLimits getStudent() { return student; }
    public void setStudent(RoleLimits student) { this.student = student; }

    public RoleLimits getTeacher() { return teacher; }
    public void setTeacher(RoleLimits teacher) { this.teacher = teacher; }

    public static class RoleLimits {
        private int maxDurationHours = 2;
        private int maxPerWeek = 5;

        public int getMaxDurationHours() { return maxDurationHours; }
        public void setMaxDurationHours(int maxDurationHours) { this.maxDurationHours = maxDurationHours; }

        public int getMaxPerWeek() { return maxPerWeek; }
        public void setMaxPerWeek(int maxPerWeek) { this.maxPerWeek = maxPerWeek; }
    }
}
