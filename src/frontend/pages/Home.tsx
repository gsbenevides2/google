import React, { useCallback, useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { apiClient } from "../services/api";

export const Home: React.FC = () => {
	const [accounts, setAccounts] = useState<string[]>([]);

	// Função para buscar todas as plataformas
	const getAccounts = useCallback(async () => {
		try {
		} catch (error) {}
	}, []);

	const goToLogin = () => {
		window.location.href = "/api/auth";
	};

	const handleLogout = async () => {
		await apiClient.api.auth.logout.post();
		window.location.href = "/login";
	};

	// Busca todas as plataformas ao carregar a página
	useEffect(() => {
		getAccounts();
	}, [getAccounts]);

	return (
		<div className="min-h-screen bg-gray-900 text-gray-200">
			<div className="container mx-auto px-4 py-8">
				<header className="mb-8 flex justify-between items-center">
					<div>
						<h1 className="text-3xl font-bold text-gray-100">Google</h1>
						<p className="text-gray-400 mt-2">Hub de integração com o Google</p>
					</div>
					<div className="flex gap-4">
						<Button onClick={goToLogin}>
							<svg
								className="h-4 w-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 6v6m0 0v6m0-6h6m-6 0H6"
								/>
							</svg>
							Adicionar nova conta
						</Button>
						<Button variant="destructive" onClick={handleLogout}>
							<svg
								className="h-4 w-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
								/>
							</svg>
							Logout
						</Button>
					</div>
				</header>

				{/* Tabela de plataformas */}
				<div className="bg-gray-800 rounded-lg overflow-hidden">
					<div className="grid grid-cols-5 gap-4 p-4 border-b border-gray-700 font-bold text-gray-100">
						<span>Email</span>
					</div>

					{accounts.length === 0 ? (
						<div className="p-8 text-center text-gray-400">
							<svg
								className="h-12 w-12 mx-auto mb-4 text-gray-500"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
								/>
							</svg>
							<p className="text-lg">Nenhuma conta cadastrada</p>
							<p className="text-sm">
								Clique em "Adicionar nova conta" para adicionar uma conta.
							</p>
						</div>
					) : (
						accounts.map((account) => (
							<div
								key={account}
								className="grid grid-cols-5 gap-4 p-4 border-b border-gray-700 hover:bg-gray-750 transition-colors"
							>
								<span className="font-medium text-gray-200">{account}</span>
							</div>
						))
					)}
				</div>
			</div>
		</div>
	);
};
