-- ============================================================
-- CIMCO MDC Dashboard — Test Seed Data
-- Matches production table: mdc.valtb_hourly_dashboard
-- ============================================================

CREATE DATABASE IF NOT EXISTS MDC CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE MDC;

CREATE TABLE IF NOT EXISTS `valtb_hourly_dashboard` (
  `id`        INT AUTO_INCREMENT PRIMARY KEY,
  `portid`    VARCHAR(10)  NOT NULL,
  `starttime` VARCHAR(20)  NOT NULL,
  `endtime`   VARCHAR(20)  NOT NULL DEFAULT '0',
  `state`     VARCHAR(10)  NOT NULL DEFAULT 'CLOSED',
  `name`      VARCHAR(50)  NOT NULL DEFAULT 'HOURLY DASHBOARD',
  `column1`   INT DEFAULT 0,
  `column2`   INT DEFAULT NULL,
  `column3`   INT DEFAULT 0,
  INDEX idx_portid_time (`portid`, `starttime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Generate test data for today's shift (08:00–16:00) ──
-- Uses variables so data is always "today"

SET @base = UNIX_TIMESTAMP(CONCAT(CURDATE(), ' 00:00:00'));
SET @h08 = @base + 28800;
SET @h09 = @base + 32400;
SET @h10 = @base + 36000;
SET @h11 = @base + 39600;
SET @h12 = @base + 43200;
SET @h13 = @base + 46800;
SET @h14 = @base + 50400;
SET @h15 = @base + 54000;

-- Hourly target pattern: 11, 11, 6, 11, 11, 6, 11, 11
-- Cumulative targets:    11, 22, 28, 39, 50, 56, 67, 78

-- ── Machine 1 (CNC Lathe #1): Good ~88% ──
INSERT INTO valtb_hourly_dashboard (portid, starttime, endtime, state, name, column1, column2, column3) VALUES
('1', @h08, @h08+3599, 'CLOSED', 'HOURLY DASHBOARD', 11, 11, 9),
('1', @h09, @h09+3599, 'CLOSED', 'HOURLY DASHBOARD', 22, 11, 10),
('1', @h10, @h10+3599, 'CLOSED', 'HOURLY DASHBOARD', 28, 6,  5),
('1', @h11, @h11+3599, 'CLOSED', 'HOURLY DASHBOARD', 39, 11, 9),
('1', @h12, @h12+3599, 'CLOSED', 'HOURLY DASHBOARD', 50, 11, 10),
('1', @h13, @h13+3599, 'CLOSED', 'HOURLY DASHBOARD', 56, 6,  6),
('1', @h14, @h14+3599, 'CLOSED', 'HOURLY DASHBOARD', 67, 11, 10),
('1', @h15, @h15+3599, 'CLOSED', 'HOURLY DASHBOARD', 78, 11, 10);

-- ── Machine 2 (CNC Mill #2): Behind ~51% (red) ──
INSERT INTO valtb_hourly_dashboard (portid, starttime, endtime, state, name, column1, column2, column3) VALUES
('2', @h08, @h08+3599, 'CLOSED', 'HOURLY DASHBOARD', 11, 11, 6),
('2', @h09, @h09+3599, 'CLOSED', 'HOURLY DASHBOARD', 22, 11, 5),
('2', @h10, @h10+3599, 'CLOSED', 'HOURLY DASHBOARD', 28, 6,  3),
('2', @h11, @h11+3599, 'CLOSED', 'HOURLY DASHBOARD', 39, 11, 6),
('2', @h12, @h12+3599, 'CLOSED', 'HOURLY DASHBOARD', 50, 11, 7),
('2', @h13, @h13+3599, 'CLOSED', 'HOURLY DASHBOARD', 56, 6,  2),
('2', @h14, @h14+3599, 'CLOSED', 'HOURLY DASHBOARD', 67, 11, 5),
('2', @h15, @h15+3599, 'CLOSED', 'HOURLY DASHBOARD', 78, 11, 6);

-- ── Machine 3 (Drill Press #3): On track 100% (green) ──
INSERT INTO valtb_hourly_dashboard (portid, starttime, endtime, state, name, column1, column2, column3) VALUES
('3', @h08, @h08+3599, 'CLOSED', 'HOURLY DASHBOARD', 11, 11, 11),
('3', @h09, @h09+3599, 'CLOSED', 'HOURLY DASHBOARD', 22, 11, 12),
('3', @h10, @h10+3599, 'CLOSED', 'HOURLY DASHBOARD', 28, 6,  6),
('3', @h11, @h11+3599, 'CLOSED', 'HOURLY DASHBOARD', 39, 11, 11),
('3', @h12, @h12+3599, 'CLOSED', 'HOURLY DASHBOARD', 50, 11, 11),
('3', @h13, @h13+3599, 'CLOSED', 'HOURLY DASHBOARD', 56, 6,  7),
('3', @h14, @h14+3599, 'CLOSED', 'HOURLY DASHBOARD', 67, 11, 12),
('3', @h15, @h15+3599, 'CLOSED', 'HOURLY DASHBOARD', 78, 11, 11);

-- ── Machine 4 (Grinder #4): Warning ~82% (yellow) ──
INSERT INTO valtb_hourly_dashboard (portid, starttime, endtime, state, name, column1, column2, column3) VALUES
('4', @h08, @h08+3599, 'CLOSED', 'HOURLY DASHBOARD', 11, 11, 9),
('4', @h09, @h09+3599, 'CLOSED', 'HOURLY DASHBOARD', 22, 11, 10),
('4', @h10, @h10+3599, 'CLOSED', 'HOURLY DASHBOARD', 28, 6,  5),
('4', @h11, @h11+3599, 'CLOSED', 'HOURLY DASHBOARD', 39, 11, 9),
('4', @h12, @h12+3599, 'CLOSED', 'HOURLY DASHBOARD', 50, 11, 9),
('4', @h13, @h13+3599, 'CLOSED', 'HOURLY DASHBOARD', 56, 6,  5),
('4', @h14, @h14+3599, 'CLOSED', 'HOURLY DASHBOARD', 67, 11, 9),
('4', @h15, @h15+3599, 'CLOSED', 'HOURLY DASHBOARD', 78, 11, 9);

-- ── Machine 5 (CNC Router #5): Solid ~96% (yellow) ──
INSERT INTO valtb_hourly_dashboard (portid, starttime, endtime, state, name, column1, column2, column3) VALUES
('5', @h08, @h08+3599, 'CLOSED', 'HOURLY DASHBOARD', 11, 11, 10),
('5', @h09, @h09+3599, 'CLOSED', 'HOURLY DASHBOARD', 22, 11, 11),
('5', @h10, @h10+3599, 'CLOSED', 'HOURLY DASHBOARD', 28, 6,  6),
('5', @h11, @h11+3599, 'CLOSED', 'HOURLY DASHBOARD', 39, 11, 10),
('5', @h12, @h12+3599, 'CLOSED', 'HOURLY DASHBOARD', 50, 11, 11),
('5', @h13, @h13+3599, 'CLOSED', 'HOURLY DASHBOARD', 56, 6,  6),
('5', @h14, @h14+3599, 'CLOSED', 'HOURLY DASHBOARD', 67, 11, 11),
('5', @h15, @h15+3599, 'CLOSED', 'HOURLY DASHBOARD', 78, 11, 10);

-- ── Machine 6 (Plasma Cut #6): Poor ~62% (red) ──
INSERT INTO valtb_hourly_dashboard (portid, starttime, endtime, state, name, column1, column2, column3) VALUES
('6', @h08, @h08+3599, 'CLOSED', 'HOURLY DASHBOARD', 11, 11, 7),
('6', @h09, @h09+3599, 'CLOSED', 'HOURLY DASHBOARD', 22, 11, 6),
('6', @h10, @h10+3599, 'CLOSED', 'HOURLY DASHBOARD', 28, 6,  4),
('6', @h11, @h11+3599, 'CLOSED', 'HOURLY DASHBOARD', 39, 11, 7),
('6', @h12, @h12+3599, 'CLOSED', 'HOURLY DASHBOARD', 50, 11, 8),
('6', @h13, @h13+3599, 'CLOSED', 'HOURLY DASHBOARD', 56, 6,  3),
('6', @h14, @h14+3599, 'CLOSED', 'HOURLY DASHBOARD', 67, 11, 6),
('6', @h15, @h15+3599, 'CLOSED', 'HOURLY DASHBOARD', 78, 11, 7);
