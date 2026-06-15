interface Item {
    id: number;
    name: string;
}

const fetchItems = async (): Promise<void> => {
    const appDiv = document.getElementById('app');
    
    try {
        const response = await fetch('http://localhost:8000/api/items');
        if (!response.ok) throw new Error('Chyba sítě');
        
        const data: Item[] = await response.json();
        
        if (appDiv) {
            appDiv.innerHTML = `
                <ul>
                    ${data.map(item => `<li><strong>ID ${item.id}:</strong> ${item.name}</li>`).join('')}
                </ul>
            `;
        }
    } catch (error) {
        console.error("Chyba při stahování dat:", error);
        if (appDiv) {
            appDiv.innerHTML = '<p style="color: red;">Nepodařilo se připojit k backendu.</p>';
        }
    }
};

fetchItems();