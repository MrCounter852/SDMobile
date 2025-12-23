import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export const COLORS = {
    primary: "#337ab7",
    secondary: "#88E782",
    background: "#F3F4F6",
    card: "#FFFFFF",
    text: "#1F2937",
    textSecondary: "#6B7280",
    border: "#E5E7EB",
    inputBg: "#F9FAFB",
    focus: "#337ab7",
    white: "#FFFFFF",
    danger: "#DC2626",
    success: "#10B981",
};

export const CustomInput = ({
    label,
    required,
    value,
    onChangeText,
    placeholder,
    multiline,
    keyboardType,
    icon,
    error,
}) => (
    <View style={styles.inputContainer}>
        <View style={styles.labelContainer}>
            <Text style={styles.label}>{label}</Text>
            {required && <Text style={styles.required}>*</Text>}
        </View>
        <View
            style={[
                styles.inputWrapper,
                multiline && styles.inputWrapperMultiline,
                error && styles.inputWrapperError
            ]}
        >
            {icon && (
                <Ionicons
                    name={icon}
                    size={20}
                    color={error ? COLORS.danger : COLORS.textSecondary}
                    style={styles.inputIcon}
                />
            )}
            <TextInput
                style={[styles.input, multiline && styles.inputMultiline]}
                value={value ? String(value) : ""}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={COLORS.textSecondary}
                multiline={multiline}
                keyboardType={keyboardType}
            />
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
);

export const SectionHeader = ({ title, icon }) => (
    <View style={styles.sectionHeader}>
        <View style={styles.sectionIconContainer}>
            <Ionicons name={icon} size={18} color={COLORS.primary} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
    </View>
);

const styles = StyleSheet.create({
    inputContainer: {
        marginBottom: 16,
    },
    labelContainer: {
        flexDirection: "row",
        marginBottom: 8,
        alignItems: "center",
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.text,
    },
    required: {
        color: COLORS.danger,
        marginLeft: 4,
        fontSize: 14,
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.inputBg,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 12,
        height: 50,
    },
    inputWrapperError: {
        borderColor: COLORS.danger,
        backgroundColor: "#FEF2F2",
    },
    inputWrapperMultiline: {
        height: 100,
        alignItems: "flex-start",
        paddingVertical: 12,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        color: COLORS.text,
        fontSize: 15,
        height: "100%",
    },
    inputMultiline: {
        textAlignVertical: "top",
    },
    errorText: {
        color: COLORS.danger,
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    sectionIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: "#EFF6FF",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.text,
    },
});

export default { COLORS, CustomInput, SectionHeader };
