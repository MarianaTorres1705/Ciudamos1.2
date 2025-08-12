// src/screens/RegisterScreen.tsx
import React, { useState } from 'react';
import {
  Image,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../presentation/navigator/RootNavigator';

import { EyeIcon, EyeOffIcon } from '../presentation/icons/icons';
import { colors } from '../config/theme/theme';

const UI = {
  bg: '#F4F7FC',
  card: '#FFFFFF',
  muted: '#797C8A',
  border: '#E9E9E9',
  primary: '#0AC5C5',
};

const { height: SCREEN_H } = Dimensions.get('screen');
const MAX_W = 460;

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Si luego quieres validar, agrega:
  // const [password, setPassword] = useState('');
  // const [confirmPassword, setConfirmPassword] = useState('');

  const goLogin = () => navigation.navigate('Login');

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { minHeight: SCREEN_H }]}
      keyboardShouldPersistTaps="handled"
    >
      {/* Logo */}
      <Image
        source={require('../presentation/assets/images/Logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Título y subtítulo */}
      <Text style={styles.title}>Crear cuenta</Text>
      <Text style={styles.subtitle}>
        Crea tu cuenta para reportar y seguir incidentes en tu zona.
      </Text>

      <View style={styles.hr} />

      {/* Campos */}
      <View style={styles.inputWrap}>
        <TextInput
          placeholder="Nombre completo"
          placeholderTextColor={UI.muted}
          style={styles.inputField}
          returnKeyType="next"
        />
      </View>

      <View style={[styles.inputWrap, { marginTop: 12 }]}>
        <TextInput
          placeholder="Nombre de usuario"
          placeholderTextColor={UI.muted}
          style={styles.inputField}
          autoCapitalize="none"
          returnKeyType="next"
        />
      </View>

      <View style={[styles.inputWrap, { marginTop: 12 }]}>
        <TextInput
          placeholder="Correo electrónico"
          placeholderTextColor={UI.muted}
          keyboardType="email-address"
          style={styles.inputField}
          autoCapitalize="none"
          returnKeyType="next"
        />
      </View>

      <View style={[styles.inputWrap, { marginTop: 12 }]}>
        <TextInput
          placeholder="RFC"
          placeholderTextColor={UI.muted}
          style={styles.inputField}
          autoCapitalize="characters"
          returnKeyType="next"
        />
      </View>

      <View style={[styles.inputWrap, { marginTop: 12 }]}>
        <TextInput
          placeholder="Teléfono"
          placeholderTextColor={UI.muted}
          keyboardType="phone-pad"
          style={styles.inputField}
          returnKeyType="next"
        />
      </View>

      {/* Contraseña */}
      <View style={[styles.inputWrap, { marginTop: 12 }]}>
        <TextInput
          placeholder="Contraseña"
          placeholderTextColor={UI.muted}
          secureTextEntry={!showPassword}
          style={[styles.inputField, { paddingRight: 44 }]}
          returnKeyType="next"
          // onChangeText={setPassword}
        />
        <TouchableOpacity
          accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          onPress={() => setShowPassword(prev => !prev)}
          style={styles.eyeButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
        </TouchableOpacity>
      </View>

      {/* Confirmar contraseña (nuevo) */}
      <View style={[styles.inputWrap, { marginTop: 12 }]}>
        <TextInput
          placeholder="Confirmar contraseña"
          placeholderTextColor={UI.muted}
          secureTextEntry={!showConfirm}
          style={[styles.inputField, { paddingRight: 44 }]}
          returnKeyType="done"
          // onChangeText={setConfirmPassword}
        />
        <TouchableOpacity
          accessibilityLabel={showConfirm ? 'Ocultar confirmación' : 'Mostrar confirmación'}
          onPress={() => setShowConfirm(prev => !prev)}
          style={styles.eyeButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
        </TouchableOpacity>
      </View>

      {/* Botón Registrarse */}
      <Pressable style={styles.primaryBtn} onPress={goLogin}>
        <Text style={styles.primaryTxt}>Registrarse</Text>
      </Pressable>

      {/* Footer: ir a Login */}
      <View style={styles.footerRow}>
        <Text style={styles.footerText}>¿Ya tienes cuenta?</Text>
        <Pressable onPress={goLogin}>
          <Text style={styles.footerLink}> Inicia sesión</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: UI.bg,
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 72,
    paddingBottom: 28,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    color: UI.primary,
    fontFamily: 'Poppins-Medium',
  },
  subtitle: {
    color: UI.muted,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 18,
    lineHeight: 20,
    paddingHorizontal: 10,
    fontFamily: 'Poppins-Regular',
    maxWidth: 460,
  },
  hr: {
    height: 1,
    backgroundColor: UI.border,
    width: '100%',
    maxWidth: 460,
    marginVertical: 10,
  },
  inputWrap: {
    backgroundColor: UI.card,
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: UI.border,
    paddingHorizontal: 16,
    height: 54,
    alignItems: 'center',
    flexDirection: 'row',
    width: '100%',
    maxWidth: 460,
  },
  inputField: {
    flex: 1,
    paddingHorizontal: 2,
    color: colors.text,
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  primaryBtn: {
    width: '100%',
    maxWidth: 460,
    height: 56,
    borderRadius: 28,
    backgroundColor: UI.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: UI.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  primaryTxt: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    letterSpacing: 0.2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  footerText: {
    color: UI.muted,
    fontFamily: 'Poppins-Regular',
  },
  footerLink: {
    color: UI.primary,
    fontFamily: 'Poppins-Medium',
    fontWeight: '800',
  },
});
